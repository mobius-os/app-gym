import assert from 'node:assert/strict'
import test from 'node:test'

import { readCatalogCache } from './catalog.js'

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
