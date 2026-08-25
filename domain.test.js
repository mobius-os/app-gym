import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allExercises, defaultState, finishWorkout, lastSetsFor, normalizeState, startWorkout,
} from './domain.js'

test('normalization preserves owner records while advancing the schema', () => {
  const source = {
    schemaVersion: 1,
    routines: [{ id: 'mine', name: 'Mine', exercises: [] }],
    sessions: [{ id: 'session-1', exercises: [] }],
    customExercises: [{ id: 'custom-1', name: 'My movement' }],
    activeWorkout: { id: 'draft-1', exercises: [] },
    preferences: { unit: 'lb' },
  }
  const normalized = normalizeState(source)

  assert.equal(normalized.schemaVersion, 3)
  assert.deepEqual(normalized.routines, source.routines)
  assert.deepEqual(normalized.sessions, source.sessions)
  assert.deepEqual(normalized.customExercises, source.customExercises)
  assert.deepEqual(normalized.activeWorkout, source.activeWorkout)
  assert.equal(normalized.preferences.unit, 'lb')
})

test('remote catalogue metadata cannot replace richer built-in records', () => {
  const state = defaultState()
  const exercises = allExercises(state, [{ id: 'EIeI8Vf', name: 'Bench press', target: 'Chest' }])
  const bench = exercises.find((exercise) => exercise.id === 'EIeI8Vf')

  assert.equal(bench.name, 'Bench Press (Barbell)')
  assert.ok(bench.instructions.length > 0)
})

test('a routine becomes a recoverable draft with independent set records', () => {
  const workout = startWorkout({
    id: 'upper',
    name: 'Upper',
    exercises: [{ exerciseId: 'EIeI8Vf', sets: 2, targetReps: 6, restSeconds: 120 }],
  })

  assert.equal(workout.name, 'Upper')
  assert.equal(workout.exercises[0].sets.length, 2)
  assert.equal(workout.exercises[0].sets[0].reps, 6)
  assert.notEqual(workout.exercises[0].sets[0].id, workout.exercises[0].sets[1].id)
  assert.equal(finishWorkout(workout).durationSeconds >= 1, true)
})

test('previous values come from the newest matching session', () => {
  const state = normalizeState({
    sessions: [
      { id: 'older', exercises: [{ exerciseId: 'EIeI8Vf', sets: [{ weight: 40, reps: 8 }] }] },
      { id: 'newer', exercises: [{ exerciseId: 'EIeI8Vf', sets: [{ weight: 50, reps: 6 }] }] },
    ],
  })

  assert.deepEqual(lastSetsFor(state, 'EIeI8Vf'), [{ weight: 50, reps: 6 }])
})
