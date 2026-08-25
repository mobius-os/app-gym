import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allExercises, defaultState, exerciseProgress, familiarExerciseIds, finishWorkout, isPersonalRecord, lastSetsFor,
  moveWorkoutExercise, normalizeState, removeWorkoutExercise, replaceWorkoutExercise, sessionLog, sessionLogs, startWorkout, trainingSnapshot,
} from './domain.js'

test('normalization preserves owner records while advancing the schema', () => {
  const source = {
    schemaVersion: 1,
    routines: [{ id: 'mine', name: 'Mine', exercises: [] }],
    sessions: [{ id: 'session-1', exercises: [] }],
    customExercises: [{ id: 'custom-1', name: 'My movement' }],
    exerciseNotes: { 'custom-1': 'Seat 4' },
    activeWorkout: { id: 'draft-1', exercises: [] },
    preferences: { unit: 'lb' },
  }
  const normalized = normalizeState(source)

  assert.equal(normalized.schemaVersion, 5)
  assert.deepEqual(normalized.routines, source.routines)
  assert.deepEqual(normalized.sessions, source.sessions)
  assert.deepEqual(normalized.customExercises, source.customExercises)
  assert.deepEqual(normalized.exerciseNotes, source.exerciseNotes)
  assert.deepEqual(normalized.activeWorkout, source.activeWorkout)
  assert.equal(normalized.preferences.unit, 'lb')
})

test('legacy built-in exercise ids migrate to media-backed catalogue ids without losing records', () => {
  const state = normalizeState({
    routines: [{ id: 'upper', exercises: [{ exerciseId: 'cable-row', sets: 3 }] }],
    sessions: [{ id: 'done', exercises: [{ exerciseId: 'shoulder-press', sets: [{ weight: 20, reps: 8, completed: true }] }] }],
    activeWorkout: { id: 'draft', exercises: [{ exerciseId: 'leg-press', sets: [{ id: 'set-1', weight: '100', reps: '10', completed: false }] }] },
    exerciseNotes: { 'pull-up': 'Neutral handles' },
  })

  assert.equal(state.routines[0].exercises[0].exerciseId, 'fUBheHs')
  assert.equal(state.sessions[0].exercises[0].exerciseId, 'znQUdHY')
  assert.equal(state.sessions[0].exercises[0].sets[0].weight, 20)
  assert.equal(state.activeWorkout.exercises[0].exerciseId, '2Qh2J1e')
  assert.equal(state.activeWorkout.exercises[0].sets[0].weight, '100')
  assert.equal(state.exerciseNotes['0V2YQjW'], 'Neutral handles')
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
  assert.equal(workout.restTimer, null)
  assert.notEqual(workout.exercises[0].sets[0].id, workout.exercises[0].sets[1].id)
  workout.restTimer = { endsAt: Date.now() + 90000 }
  const finished = finishWorkout(workout)
  assert.equal(finished.durationSeconds >= 1, true)
  assert.equal('restTimer' in finished, false)
})

test('previous values come from the newest matching completed session', () => {
  const state = normalizeState({
    sessions: [
      { id: 'older', exercises: [{ exerciseId: 'EIeI8Vf', sets: [{ weight: 40, reps: 8 }] }] },
      { id: 'newer', exercises: [{ exerciseId: 'EIeI8Vf', sets: [{ weight: 50, reps: 6, completed: true }] }] },
      { id: 'skipped', exercises: [{ exerciseId: 'EIeI8Vf', sets: [{ weight: 45, reps: 7, completed: false }] }] },
    ],
  })

  assert.deepEqual(lastSetsFor(state, 'EIeI8Vf'), [{ weight: 50, reps: 6, completed: true }])
})

test('familiar exercise discovery is newest-first, unique, and filled from routines', () => {
  const state = normalizeState({
    sessions: [
      { id: 'older', exercises: [{ exerciseId: 'squat' }, { exerciseId: 'bench' }] },
      { id: 'newer', exercises: [{ exerciseId: 'deadlift' }, { exerciseId: 'squat' }] },
    ],
    routines: [{ id: 'routine', exercises: [{ exerciseId: 'row' }, { exerciseId: 'bench' }] }],
  })

  assert.deepEqual(familiarExerciseIds(state, 4), ['deadlift', 'squat', 'bench', 'row'])
})

test('active workout exercise actions preserve order safely and never reassign logged sets', () => {
  const firstSet = { id: 'logged', weight: '80', reps: '5', completed: true }
  const active = {
    id: 'draft',
    restTimer: { exerciseId: 'bench', endsAt: 1000 },
    exercises: [
      { exerciseId: 'bench', restSeconds: 120, sets: [firstSet] },
      { exerciseId: 'row', restSeconds: 90, sets: [{ id: 'row-set', weight: '', reps: '', completed: false }] },
    ],
  }

  const replaced = replaceWorkoutExercise(active, 0, 'press')
  assert.equal(replaced.exercises[0].exerciseId, 'press')
  assert.deepEqual({ ...replaced.exercises[0].sets[0], id: 'new' }, { id: 'new', weight: '', reps: '', completed: false })
  assert.notEqual(replaced.exercises[0].sets[0].id, firstSet.id)
  assert.equal(replaced.exercises[0].restSeconds, 120)
  assert.equal(replaced.restTimer, null)

  const moved = moveWorkoutExercise(active, 1, 0)
  assert.deepEqual(moved.exercises.map((item) => item.exerciseId), ['row', 'bench'])
  assert.equal(active.exercises[0].exerciseId, 'bench')

  const removed = removeWorkoutExercise(active, 0)
  assert.deepEqual(removed.exercises.map((item) => item.exerciseId), ['row'])
  assert.equal(removed.restTimer, null)
})

test('exercise progress derives records and recent sessions without storing analytics', () => {
  const state = normalizeState({ sessions: [
    { id: 'older', finishedAt: '2026-08-01T10:00:00Z', exercises: [{ exerciseId: 'EIeI8Vf', sets: [
      { weight: 50, reps: 8, completed: true },
      { weight: 50, reps: 8, completed: true },
    ] }] },
    { id: 'newer', finishedAt: '2026-08-08T10:00:00Z', exercises: [{ exerciseId: 'EIeI8Vf', sets: [
      { weight: 60, reps: 5, completed: true },
      { weight: 100, reps: 1, completed: false },
    ] }] },
  ] })

  const progress = exerciseProgress(state, 'EIeI8Vf')
  assert.equal(progress.workouts, 2)
  assert.equal(progress.bestWeight, 60)
  assert.equal(Math.round(progress.bestE1rm), 70)
  assert.equal(progress.bestSessionVolume, 800)
  assert.equal(progress.recent[0].sessionId, 'newer')
  assert.equal(progress.recent[0].completedSets, 1)
  assert.equal(progress.series[0].isBaseline, true)
  assert.equal(progress.series[1].isRecord, true)
  assert.equal(progress.series[1].bestSet.setIndex, 0)
})

test('personal records and session logs are derived against earlier completed sessions only', () => {
  const state = normalizeState({ sessions: [
    { id: 'baseline', finishedAt: '2026-08-01T10:00:00Z', exercises: [{ exerciseId: 'EIeI8Vf', sets: [
      { id: 'base-set', weight: 50, reps: 8, completed: true },
    ] }] },
    { id: 'record', finishedAt: '2026-08-08T10:00:00Z', exercises: [{ exerciseId: 'EIeI8Vf', sets: [
      { id: 'record-set', weight: 60, reps: 8, completed: true },
      { id: 'unfinished', weight: 100, reps: 1, completed: false },
    ] }] },
  ] })

  assert.equal(isPersonalRecord(state, 'EIeI8Vf', { weight: 70, reps: 5, completed: true }), true)
  assert.equal(isPersonalRecord(state, 'EIeI8Vf', { weight: 70, reps: 5, completed: false }), false)
  const log = sessionLog(state, 'record')
  assert.equal(log.recordCount, 1)
  assert.equal(log.exercises[0].sets.length, 1)
  assert.equal(log.exercises[0].sets[0].recordLabel, 'Weight PR')
  assert.equal(sessionLog(state, 'baseline').recordCount, 0)
})

test('one analytics pass handles unsorted sessions and repeated exercise blocks', () => {
  const state = normalizeState({ sessions: [
    { id: 'record', finishedAt: '2026-08-08T10:00:00Z', exercises: [
      { exerciseId: 'EIeI8Vf', sets: [{ id: 'warmup', weight: 45, reps: 8, completed: true }] },
      { exerciseId: 'EIeI8Vf', sets: [{ id: 'record-set', weight: 60, reps: 8, completed: true }] },
    ] },
    { id: 'baseline', finishedAt: '2026-08-01T10:00:00Z', exercises: [{ exerciseId: 'EIeI8Vf', sets: [
      { id: 'base-set', weight: 50, reps: 8, completed: true },
    ] }] },
  ] })

  const logs = sessionLogs(state)
  const record = logs.get('record')
  assert.equal(record, sessionLog(state, 'record'))
  assert.equal(record.recordCount, 1)
  assert.equal(record.exercises[0].sets[0].isPersonalRecord, false)
  assert.equal(record.exercises[1].sets[0].isPersonalRecord, true)
  assert.equal(record.exercises[1].sets[0].recordLabel, 'Weight PR')
  assert.deepEqual(exerciseProgress(state, 'EIeI8Vf').series.map((point) => point.sessionId), ['baseline', 'record'])
})

test('training snapshot compares completed work across rolling seven-day windows', () => {
  const now = Date.UTC(2026, 7, 25)
  const session = (id, daysAgo, sets) => ({
    id,
    finishedAt: new Date(now - (daysAgo * 86400000)).toISOString(),
    exercises: [{ exerciseId: 'EIeI8Vf', sets }],
  })
  const state = normalizeState({ sessions: [
    session('recent', 2, [{ weight: 50, reps: 5, completed: true }, { weight: 50, reps: 5, completed: true }]),
    session('previous', 9, [{ weight: 40, reps: 5, completed: true }]),
    session('legacy', 4, [{ weight: 20, reps: 10 }]),
    session('empty', 1, []),
    session('invalid', 3, [{ weight: 100, reps: 0, completed: true }]),
  ] })

  assert.deepEqual(trainingSnapshot(state, now), {
    workouts: 2,
    completedSets: 3,
    trainingVolume: 700,
    setDelta: 2,
  })
})
