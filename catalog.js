const API_ROOT = 'https://oss.exercisedb.dev/api/v1/exercises'
const MEDIA_ORIGIN = 'https://static.exercisedb.dev'
const MEDIA_PATH = '/media/'
const CACHE_PATH = 'exercise_catalog.json'
const PAGE_SIZE = 25
const MAX_PAGES = 80
const CHECKPOINT_EVERY = 4
const RETRY_DELAYS = [350, 1000]
const THUMBNAIL_VERSION = 2
const THUMBNAIL_RETRY_MS = 7 * 24 * 60 * 60 * 1000
const THUMBNAIL_SIZE = 96
const THUMBNAIL_MEMORY_LIMIT = 180
const thumbnailMemory = new Map()
const thumbnailRequests = new Map()
const thumbnailQueue = []
let thumbnailWorkers = 0

function rememberThumbnail(exerciseId, imageData) {
  thumbnailMemory.delete(exerciseId)
  thumbnailMemory.set(exerciseId, imageData)
  while (thumbnailMemory.size > THUMBNAIL_MEMORY_LIMIT) {
    thumbnailMemory.delete(thumbnailMemory.keys().next().value)
  }
}

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function compactExercise(item) {
  return {
    id: item.exerciseId,
    name: titleCase(item.name),
    bodyPart: titleCase(item.bodyParts?.[0] || 'Other'),
    equipment: titleCase(item.equipments?.[0] || 'Other'),
    target: titleCase(item.targetMuscles?.[0] || 'Other'),
    secondaryMuscles: (item.secondaryMuscles || []).map(titleCase),
    source: 'exercisedb-v1',
  }
}

function fullExercise(item) {
  return {
    ...compactExercise(item),
    gifUrl: item.gifUrl,
    instructions: item.instructions || [],
  }
}

export function exerciseThumbnailPath(exerciseId) {
  return `exercise_thumbnails/${String(exerciseId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
}

export function exerciseGifUrl(exercise) {
  const candidate = exercise?.gifUrl || (exercise?.source === 'exercisedb-v1' && exercise?.id
    ? `${MEDIA_ORIGIN}${MEDIA_PATH}${encodeURIComponent(exercise.id)}.gif`
    : null)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' && url.origin === MEDIA_ORIGIN && url.pathname.startsWith(MEDIA_PATH) ? url.href : null
  } catch {
    return null
  }
}

async function proxyJson(token, url, signal) {
  const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) {
    const error = new Error(`ExerciseDB returned ${response.status}`)
    error.status = response.status
    throw error
  }
  return response.json()
}

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Exercise catalogue sync aborted', 'AbortError'))
      return
    }
    const onAbort = () => {
      globalThis.clearTimeout(timer)
      reject(new DOMException('Exercise catalogue sync aborted', 'AbortError'))
    }
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, milliseconds)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

async function requestPage(token, url, signal) {
  let attempt = 0
  while (true) {
    try {
      return await proxyJson(token, url, signal)
    } catch (error) {
      if (error.name === 'AbortError' || (error.status && error.status < 500 && error.status !== 429) || attempt >= RETRY_DELAYS.length) throw error
      await delay(RETRY_DELAYS[attempt], signal)
      attempt += 1
    }
  }
}

function makeCache({ byId, total, nextCursor, complete, interrupted = false }) {
  return {
    version: 2,
    source: 'ExerciseDB V1 by AscendAPI',
    updatedAt: new Date().toISOString(),
    total: total || byId.size,
    nextCursor: complete ? null : nextCursor,
    complete,
    interrupted,
    exercises: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export async function readCatalogCache(store) {
  try {
    const cached = await store?.get(CACHE_PATH)
    if (!Array.isArray(cached?.exercises)) return null
    if (cached.version === 2) return cached
    if (cached.version === 1) return {
      ...cached,
      version: 2,
      complete: cached.exercises.length >= cached.total,
      nextCursor: null,
    }
    return null
  } catch {
    return null
  }
}

export async function syncExerciseCatalog({ token, store, seed, onProgress, signal }) {
  if (seed?.complete) return seed
  const resumableSeed = seed?.nextCursor ? seed : null
  const byId = new Map((resumableSeed?.exercises || []).map((exercise) => [exercise.id, exercise]))
  let after = resumableSeed?.nextCursor || null
  let total = resumableSeed?.total || 0
  let complete = false

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${API_ROOT}?limit=${PAGE_SIZE}${after ? `&after=${encodeURIComponent(after)}` : ''}`
    let payload
    try {
      payload = await requestPage(token, url, signal)
    } catch (error) {
      if (error.name === 'AbortError' || byId.size === 0) throw error
      const checkpoint = makeCache({ byId, total, nextCursor: after, complete: false, interrupted: true })
      await store?.set(CACHE_PATH, checkpoint)
      return checkpoint
    }
    const rows = (payload.data || []).map(compactExercise)
    rows.forEach((exercise) => byId.set(exercise.id, exercise))
    total = payload.meta?.total || total || byId.size
    onProgress?.({ exercises: [...byId.values()], loaded: byId.size, total })

    const nextCursor = payload.meta?.nextCursor || null
    if (!payload.meta?.hasNextPage || !nextCursor || rows.length === 0) {
      complete = true
      after = null
      break
    }
    after = nextCursor
    if ((page + 1) % CHECKPOINT_EVERY === 0) {
      await store?.set(CACHE_PATH, makeCache({ byId, total, nextCursor: after, complete: false }))
    }
    await delay(90, signal)
  }

  const cache = makeCache({ byId, total, nextCursor: after, complete })
  await store?.set(CACHE_PATH, cache)
  return cache
}

export async function fetchExerciseDetail(token, exercise, signal) {
  if (exercise?.source !== 'exercisedb-v1' && exercise?.instructions?.length) return exercise
  try {
    const payload = await proxyJson(token, `${API_ROOT}/${encodeURIComponent(exercise.id)}`, signal)
    return payload.data ? { ...exercise, ...fullExercise(payload.data) } : exercise
  } catch (error) {
    if (error.name === 'AbortError') throw error
    return exercise
  }
}

export async function fetchExerciseMedia(token, exercise, signal) {
  const gifUrl = exerciseGifUrl(exercise)
  if (!gifUrl || exercise.imageData) return exercise
  const response = await fetch(`/api/proxy?url=${encodeURIComponent(gifUrl)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  if (!response.ok) throw new Error(`Exercise media returned ${response.status}`)
  const blob = await response.blob()
  const imageData = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return { ...exercise, imageData }
}

async function firstFrameData(blob) {
  let source
  try {
    source = await createImageBitmap(blob)
  } catch {
    source = await new Promise((resolve, reject) => {
      const image = new Image()
      const objectUrl = URL.createObjectURL(blob)
      image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image) }
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Exercise thumbnail could not be decoded')) }
      image.src = objectUrl
    })
  }

  const width = source.naturalWidth || source.width
  const height = source.naturalHeight || source.height
  if (!width || !height) throw new Error('Exercise thumbnail has no dimensions')
  const canvas = document.createElement('canvas')
  canvas.width = THUMBNAIL_SIZE
  canvas.height = THUMBNAIL_SIZE
  const context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
  const scale = Math.min(THUMBNAIL_SIZE / width, THUMBNAIL_SIZE / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  context.drawImage(source, (THUMBNAIL_SIZE - drawWidth) / 2, (THUMBNAIL_SIZE - drawHeight) / 2, drawWidth, drawHeight)
  source.close?.()
  const webp = canvas.toDataURL('image/webp', .78)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')
}

function scheduleThumbnail(task) {
  return new Promise((resolve, reject) => {
    thumbnailQueue.push({ task, resolve, reject })
    runThumbnailQueue()
  })
}

function runThumbnailQueue() {
  while (thumbnailWorkers < 3 && thumbnailQueue.length) {
    const job = thumbnailQueue.shift()
    thumbnailWorkers += 1
    Promise.resolve().then(job.task).then(job.resolve, job.reject).finally(() => {
      thumbnailWorkers -= 1
      runThumbnailQueue()
    })
  }
}

async function fetchThumbnailBlob(token, gifUrl) {
  return scheduleThumbnail(async () => {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(gifUrl)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) return response.blob()
      if ((response.status !== 429 && response.status < 500) || attempt === RETRY_DELAYS.length) return null
      await delay(RETRY_DELAYS[attempt])
    }
    return null
  })
}

export async function loadExerciseThumbnail({ token, store, exercise }) {
  if (!exercise?.id) return null
  if (thumbnailMemory.has(exercise.id)) {
    const cached = thumbnailMemory.get(exercise.id)
    rememberThumbnail(exercise.id, cached)
    return cached
  }
  if (thumbnailRequests.has(exercise.id)) return thumbnailRequests.get(exercise.id)
  const request = (async () => {
    const path = exerciseThumbnailPath(exercise.id)
    try {
      const cached = await store?.get(path)
      if ((cached?.version === 1 || cached?.version === THUMBNAIL_VERSION) && typeof cached.imageData === 'string') {
        rememberThumbnail(exercise.id, cached.imageData)
        return cached.imageData
      }
      if (cached?.version === THUMBNAIL_VERSION && cached.unavailable === true && Date.parse(cached.retryAfter) > Date.now()) {
        rememberThumbnail(exercise.id, null)
        return null
      }
    } catch { /* A missing thumbnail is an ordinary cache miss. */ }

    const gifUrl = exerciseGifUrl(exercise)
    if (!gifUrl) return null
    const blob = await fetchThumbnailBlob(token, gifUrl)
    if (!blob) {
      rememberThumbnail(exercise.id, null)
      try {
        const checkedAt = new Date()
        await store?.set(path, {
          version: THUMBNAIL_VERSION,
          source: EXERCISEDB_CREDIT,
          unavailable: true,
          checkedAt: checkedAt.toISOString(),
          retryAfter: new Date(checkedAt.getTime() + THUMBNAIL_RETRY_MS).toISOString(),
        })
      } catch { /* The intentional fallback still works without negative caching. */ }
      return null
    }
    const imageData = await firstFrameData(blob)
    rememberThumbnail(exercise.id, imageData)
    try {
      await store?.set(path, {
        version: THUMBNAIL_VERSION,
        source: EXERCISEDB_CREDIT,
        generatedAt: new Date().toISOString(),
        imageData,
      })
    } catch { /* The visible still remains useful when persistent caching is unavailable. */ }
    return imageData
  })().finally(() => thumbnailRequests.delete(exercise.id))
  thumbnailRequests.set(exercise.id, request)
  return request
}

export const EXERCISEDB_CREDIT = 'ExerciseDB V1 by AscendAPI'
