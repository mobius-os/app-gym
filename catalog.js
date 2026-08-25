const API_ROOT = 'https://oss.exercisedb.dev/api/v1/exercises'
const CACHE_PATH = 'exercise_catalog.json'
const PAGE_SIZE = 25
const MAX_PAGES = 80
const CHECKPOINT_EVERY = 4
const RETRY_DELAYS = [350, 1000]

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
    const timer = window.setTimeout(resolve, milliseconds)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('Exercise catalogue sync aborted', 'AbortError'))
    }, { once: true })
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
  } catch {
    return exercise
  }
}

export async function fetchExerciseMedia(token, exercise, signal) {
  if (!exercise?.gifUrl || exercise.imageData) return exercise
  const response = await fetch(`/api/proxy?url=${encodeURIComponent(exercise.gifUrl)}`, {
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

export const EXERCISEDB_CREDIT = 'ExerciseDB V1 by AscendAPI'
