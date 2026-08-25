import assert from 'node:assert/strict'
import test from 'node:test'

import {
  exerciseGifUrl, exerciseThumbnailPath, fetchExerciseDetail, loadExerciseThumbnail, readCatalogCache,
  syncExerciseCatalog,
} from './catalog.js'

test('legacy catalogue caches remain readable and report completion honestly', async () => {
  const complete = await readCatalogCache({ get: async () => ({ version: 1, total: 1, exercises: [{ id: 'one' }] }) })
  const partial = await readCatalogCache({ get: async () => ({ version: 1, total: 2, exercises: [{ id: 'one' }] }) })

  assert.equal(complete.version, 2)
  assert.equal(complete.complete, true)
  assert.equal(partial.complete, false)
})

test('malformed catalogue caches are ignored', async () => {
  assert.equal(await readCatalogCache({ get: async () => ({ version: 2, exercises: null }) }), null)
  assert.equal(await readCatalogCache({ get: async () => { throw new Error('missing') } }), null)
})

test('thumbnail cache paths are stable and cannot escape their storage folder', () => {
  assert.equal(exerciseThumbnailPath('EIeI8Vf'), 'exercise_thumbnails/EIeI8Vf.json')
  assert.equal(exerciseThumbnailPath('../custom movement'), 'exercise_thumbnails/___custom_movement.json')
})

test('only owned ExerciseDB media resolves to a progressive thumbnail source', () => {
  assert.equal(exerciseGifUrl({ id: 'EIeI8Vf', source: 'exercisedb-v1' }), 'https://static.exercisedb.dev/media/EIeI8Vf.gif')
  assert.equal(exerciseGifUrl({ id: 'official', gifUrl: 'https://static.exercisedb.dev/media/official.gif' }), 'https://static.exercisedb.dev/media/official.gif')
  assert.equal(exerciseGifUrl({ id: 'custom', gifUrl: 'https://example.test/custom.gif' }), null)
  assert.equal(exerciseGifUrl({ id: 'custom', gifUrl: 'not a URL' }), null)
  assert.equal(exerciseGifUrl({ id: 'custom' }), null)
})

test('broken official thumbnail media is negatively cached instead of retried on every row mount', async (t) => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches += 1
    return { ok: false, status: 404 }
  }
  t.after(() => { globalThis.fetch = originalFetch })

  const writes = []
  const store = {
    get: async () => null,
    set: async (path, value) => writes.push({ path, value }),
  }
  const exercise = { id: 'known-broken-media', source: 'exercisedb-v1' }
  assert.equal(await loadExerciseThumbnail({ token: 'test', store, exercise }), null)
  assert.equal(await loadExerciseThumbnail({ token: 'test', store, exercise }), null)
  assert.equal(fetches, 1)
  assert.equal(writes[0].path, 'exercise_thumbnails/known-broken-media.json')
  assert.equal(writes[0].value.unavailable, true)
  assert.ok(Date.parse(writes[0].value.retryAfter) > Date.parse(writes[0].value.checkedAt))

  const cachedExercise = { id: 'cached-broken-media', source: 'exercisedb-v1' }
  assert.equal(await loadExerciseThumbnail({
    token: 'test',
    exercise: cachedExercise,
    store: { get: async () => writes[0].value, set: async () => assert.fail('fresh negative cache should not be rewritten') },
  }), null)
  assert.equal(fetches, 1)
})

test('aborted ExerciseDB work remains aborted instead of falling through recovery', async (t) => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches += 1
    return { ok: false, status: 503 }
  }
  t.after(() => { globalThis.fetch = originalFetch })

  const controller = new AbortController()
  controller.abort()
  await assert.rejects(syncExerciseCatalog({
    token: 'test',
    store: null,
    seed: null,
    signal: controller.signal,
  }), { name: 'AbortError' })
  assert.equal(fetches, 1)

  globalThis.fetch = async () => { throw new DOMException('stopped', 'AbortError') }
  await assert.rejects(fetchExerciseDetail('test', {
    id: 'exercise',
    source: 'exercisedb-v1',
  }, controller.signal), { name: 'AbortError' })
})
