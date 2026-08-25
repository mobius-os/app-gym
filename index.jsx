import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, Trash, X } from '@openai/apps-sdk-ui/components/Icon'
import { CSS } from './theme.js'
import {
  allExercises, duration, findExercise, finishWorkout, lastSetsFor,
  normalizeState, startWorkout, volume,
} from './domain.js'
import {
  EXERCISEDB_CREDIT, fetchExerciseDetail, fetchExerciseMedia,
  readCatalogCache, syncExerciseCatalog,
} from './catalog.js'

const STATE_PATH = 'workout_state.json'
const EXERCISE_PAGE_SIZE = 60

function ExerciseMark({ exercise }) {
  return <span className="wk-exercise-mark" aria-hidden="true">{exercise?.name?.slice(0, 1) || 'W'}</span>
}

export default function App({ appId, token }) {
  const store = window.mobius?.storage
  const [state, setState] = useState(null)
  const [tab, setTab] = useState('workout')
  const [toast, setToast] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [detail, setDetail] = useState(null)
  const [detailState, setDetailState] = useState('idle')
  const [builder, setBuilder] = useState(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [catalog, setCatalog] = useState([])
  const [catalogStatus, setCatalogStatus] = useState({ state: 'idle', loaded: 0, total: 1500 })
  const [catalogCacheReady, setCatalogCacheReady] = useState(false)
  const [catalogSyncNonce, setCatalogSyncNonce] = useState(0)
  const catalogSeed = useRef(null)
  const catalogSyncStarted = useRef(false)
  const readySignalled = useRef(false)

  useEffect(() => {
    let alive = true
    const applyState = (value) => {
      if (!alive) return
      const normalized = normalizeState(value)
      setState(normalized)
      if (!readySignalled.current) {
        readySignalled.current = true
        window.mobius?.signal?.('app_ready', { routine_count: normalized.routines.length })
      }
    }
    const unsubscribe = store?.subscribe?.(STATE_PATH, applyState)
    if (!unsubscribe) store?.get(STATE_PATH).then(applyState).catch(() => applyState(null))
    return () => { alive = false; if (typeof unsubscribe === 'function') unsubscribe() }
  }, [appId, store])

  useEffect(() => {
    let alive = true
    readCatalogCache(store).then((cached) => {
      if (!alive) return
      catalogSeed.current = cached
      if (cached) {
        setCatalog(cached.exercises)
        setCatalogStatus({ state: cached.complete ? 'ready' : 'partial', loaded: cached.exercises.length, total: cached.total })
      }
      setCatalogCacheReady(true)
    }).catch(() => { if (alive) setCatalogCacheReady(true) })
    return () => { alive = false }
  }, [store])

  useEffect(() => {
    if (tab !== 'exercises' || !catalogCacheReady || catalogSyncStarted.current) return
    catalogSyncStarted.current = true
    const controller = new AbortController()
    setCatalogStatus((current) => ({ ...current, state: 'loading' }))
    syncExerciseCatalog({
      token, store, seed: catalogSeed.current, signal: controller.signal,
      onProgress: ({ exercises, loaded, total }) => {
        if (loaded <= 25 || loaded % 100 === 0 || loaded === total) setCatalog(exercises)
        setCatalogStatus({ state: 'loading', loaded, total })
      },
    }).then((cache) => {
      catalogSeed.current = cache
      setCatalog(cache.exercises)
      setCatalogStatus({ state: cache.complete ? 'ready' : 'partial', loaded: cache.exercises.length, total: cache.total })
      catalogSyncStarted.current = cache.complete
    }).catch((error) => {
      if (error.name === 'AbortError') return
      setCatalogStatus((current) => ({ ...current, state: current.loaded ? 'cached' : 'error' }))
      catalogSyncStarted.current = false
      window.mobius?.signal?.('error', { source: 'exercise-catalog', message: error.message })
    })
    return () => controller.abort()
  }, [catalogCacheReady, catalogSyncNonce, store, tab, token])

  const exercises = useMemo(() => state ? allExercises(state, catalog) : [], [catalog, state])

  const persist = useCallback(async (next, message = '') => {
    setState(next)
    setSaveState('saving')
    try {
      await store?.set(STATE_PATH, next)
      setSaveState('saved')
      if (message) setToast(message)
    } catch (error) {
      setSaveState('error')
      setToast('Could not save. Your changes remain on this screen.')
      window.mobius?.signal?.('error', { source: 'save', message: error.message })
    }
    if (message) window.setTimeout(() => setToast(''), 2200)
  }, [store])

  const openExercise = useCallback(async (exercise) => {
    const controller = new AbortController()
    setDetail(exercise)
    setDetailState('loading')
    try {
      const full = await fetchExerciseDetail(token, exercise, controller.signal)
      setDetail(full)
      const withMedia = await fetchExerciseMedia(token, full, controller.signal)
      setDetail(withMedia)
      setDetailState('ready')
    } catch (error) {
      setDetailState('error')
      window.mobius?.signal?.('error', { source: 'exercise-detail', message: error.message })
    }
  }, [token])

  if (!state) {
    return <div className="wk-root"><style>{CSS}</style><div className="wk-loading">Loading your training…</div></div>
  }

  const active = state.activeWorkout
  const start = (routine) => {
    const next = { ...state, activeWorkout: startWorkout(routine) }
    persist(next, `${routine?.name || 'Workout'} started`)
    window.mobius?.signal?.('item_created', { type: 'workout' })
  }
  const updateActive = (transform) => persist({ ...state, activeWorkout: transform(state.activeWorkout) })
  const completedSets = active?.exercises?.flatMap((exercise) => exercise.sets).filter((set) => set.completed && Number(set.reps) > 0).length || 0
  const finish = () => {
    if (!active || completedSets === 0) return
    const session = finishWorkout(active)
    persist({ ...state, activeWorkout: null, sessions: [...state.sessions, session] }, 'Workout saved')
    window.mobius?.signal?.('workout_finished', { exercise_count: session.exercises.length, set_count: completedSets })
  }
  const discard = () => {
    persist({ ...state, activeWorkout: null }, 'Workout discarded')
    setDiscardOpen(false)
    window.mobius?.signal?.('item_deleted', { type: 'workout-draft' })
  }

  const title = active ? active.name : tab === 'workout' ? 'Workout' : tab === 'history' ? 'History' : 'Exercises'
  const subtitle = active
    ? `${duration((Date.now() - new Date(active.startedAt)) / 1000)} · ${completedSets} sets done`
    : tab === 'workout' ? 'Ready when you are.'
      : tab === 'history' ? `${state.sessions.length} completed workouts`
        : catalogStatus.state === 'loading' ? `Loading ${catalogStatus.loaded} of ${catalogStatus.total} exercises`
          : catalogStatus.state === 'partial' ? `${catalogStatus.loaded} exercises saved`
          : `${exercises.length} exercises`

  return (
    <div className="wk-root">
      <style>{CSS}</style>
      <header className="wk-header">
        <div className="wk-brand">
          <div className="wk-brand-text"><h1 className="wk-title">{title}</h1><span className="wk-subtitle">{subtitle}</span></div>
        </div>
        {active && <div className="wk-header-right"><button className="wk-btn wk-btn-ghost" onClick={() => setDiscardOpen(true)}>Discard</button><button className="wk-btn wk-btn-primary" disabled={completedSets === 0} onClick={finish}>Finish</button></div>}
      </header>

      {!active && <nav className="wk-seg" role="tablist" aria-label="Workout sections">
        {[['workout', 'Workout'], ['history', 'History'], ['exercises', 'Exercises']].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`wk-seg-btn${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>}

      <main className="wk-scroll">
        {active
          ? <ActiveWorkout active={active} state={state} exercises={exercises} update={updateActive} openExercise={openExercise} />
          : tab === 'workout'
            ? <WorkoutHome state={state} exercises={exercises} start={start} createRoutine={() => setBuilder({ id: crypto.randomUUID(), name: 'New routine', exercises: [] })} />
            : tab === 'history'
              ? <History state={state} />
              : <ExerciseLibrary exercises={exercises} catalogStatus={catalogStatus} openExercise={openExercise} retryCatalog={() => {
                catalogSyncStarted.current = false
                setCatalogSyncNonce((current) => current + 1)
              }} />}
      </main>

      {saveState === 'error' && <div className="wk-sync-pill is-error">Not saved</div>}
      {detail && <ExerciseDetail exercise={detail} state={detailState} close={() => setDetail(null)} />}
      {builder && <RoutineBuilder value={builder} setValue={setBuilder} exercises={exercises} close={() => setBuilder(null)} save={() => {
        const routine = { ...builder, updatedAt: new Date().toISOString() }
        persist({ ...state, routines: [...state.routines, routine] }, 'Routine saved')
        setBuilder(null)
        window.mobius?.signal?.('item_created', { type: 'routine' })
      }} />}
      {discardOpen && <ConfirmDiscard cancel={() => setDiscardOpen(false)} confirm={discard} />}
      {toast && <div className="wk-toast" role="status">{toast}</div>}
    </div>
  )
}

function WorkoutHome({ state, exercises, start, createRoutine }) {
  return <>
    <section className="wk-section">
      <h2 className="wk-section-title">Quick start</h2>
      <div className="wk-quick-actions">
        <button className="wk-btn wk-btn-secondary wk-btn-block" onClick={() => start(null)}><Plus size={17} />Start empty workout</button>
        <button className="wk-btn wk-btn-secondary wk-btn-block" onClick={createRoutine}><Plus size={17} />New routine</button>
      </div>
    </section>
    <section className="wk-section">
      <div className="wk-section-heading"><h2 className="wk-section-title">Routines</h2><span>{state.routines.length} saved</span></div>
      <div className="wk-routine-list">{state.routines.map((routine) => (
        <article className="wk-routine" key={routine.id}>
          <div className="wk-routine-main"><h3>{routine.name}</h3><p>{routine.exercises.map((item) => findExercise(state, item.exerciseId, exercises).name).join(', ') || 'No exercises yet'}</p></div>
          <button className="wk-btn wk-btn-primary" disabled={routine.exercises.length === 0} onClick={() => start(routine)}>Start routine</button>
        </article>
      ))}</div>
    </section>
  </>
}

function ActiveWorkout({ active, state, exercises, update, openExercise }) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const addExercise = (exercise) => {
    update((current) => ({ ...current, exercises: [...current.exercises, {
      exerciseId: exercise.id, restSeconds: 90,
      sets: [{ id: crypto.randomUUID(), weight: '', reps: '', completed: false }],
    }] }))
    setAdding(false)
    setQuery('')
  }
  return <>
    {active.exercises.length === 0 && <div className="wk-empty"><div className="wk-empty-title">Add your first exercise</div><p className="wk-empty-text">Build this workout as you go. It stays recoverable until you finish or discard it.</p></div>}
    {active.exercises.map((item, exerciseIndex) => {
      const exercise = findExercise(state, item.exerciseId, exercises)
      const previous = lastSetsFor(state, exercise.id)
      return <section className="wk-active-exercise" key={`${exercise.id}-${exerciseIndex}`}>
        <div className="wk-exercise-heading"><ExerciseMark exercise={exercise} /><button onClick={() => openExercise(exercise)}><strong>{exercise.name}</strong><span>Rest {item.restSeconds || 90}s · View exercise</span></button></div>
        <div className="wk-set-head"><span>Set</span><span>Previous</span><span>{state.preferences.unit}</span><span>Reps</span><span>Done</span></div>
        {item.sets.map((set, setIndex) => <div className={`wk-set-row${set.completed ? ' is-complete' : ''}`} key={set.id}>
          <span className="wk-set-number">{setIndex + 1}</span>
          <span className="wk-previous">{previous[setIndex] ? `${previous[setIndex].weight || '—'} × ${previous[setIndex].reps || '—'}` : '—'}</span>
          {['weight', 'reps'].map((field) => <input key={field} className="wk-input wk-set-input" inputMode="decimal" aria-label={`${field} set ${setIndex + 1} for ${exercise.name}`} value={set[field]} onChange={(event) => update((current) => ({ ...current, exercises: current.exercises.map((candidate, index) => index === exerciseIndex ? { ...candidate, sets: candidate.sets.map((row) => row.id === set.id ? { ...row, [field]: event.target.value, completed: field === 'reps' && Number(event.target.value) <= 0 ? false : row.completed } : row) } : candidate) }))} />)}
          <button className={`wk-check${set.completed ? ' is-complete' : ''}`} disabled={!set.completed && Number(set.reps) <= 0} title={!set.completed && Number(set.reps) <= 0 ? 'Enter reps before marking this set done' : undefined} aria-label={!set.completed && Number(set.reps) <= 0 ? `Enter reps before marking set ${setIndex + 1} complete` : `${set.completed ? 'Unmark' : 'Mark'} set ${setIndex + 1} complete`} onClick={() => update((current) => ({ ...current, exercises: current.exercises.map((candidate, index) => index === exerciseIndex ? { ...candidate, sets: candidate.sets.map((row) => row.id === set.id ? { ...row, completed: !row.completed } : row) } : candidate) }))}><Check size={18} /></button>
        </div>)}
        <button className="wk-add-set" onClick={() => update((current) => ({ ...current, exercises: current.exercises.map((candidate, index) => index === exerciseIndex ? { ...candidate, sets: [...candidate.sets, { id: crypto.randomUUID(), weight: '', reps: '', completed: false }] } : candidate) }))}><Plus size={16} />Add set</button>
      </section>
    })}
    {adding
      ? <ExercisePicker exercises={exercises} query={query} setQuery={setQuery} choose={addExercise} cancel={() => setAdding(false)} />
      : <button className="wk-btn wk-btn-secondary wk-btn-block" onClick={() => setAdding(true)}><Plus size={17} />Add exercise</button>}
  </>
}

function ExercisePicker({ exercises, query, setQuery, choose, cancel }) {
  const results = exercises.filter((exercise) => exerciseSearchText(exercise).includes(query.trim().toLowerCase())).slice(0, 40)
  return <section className="wk-picker" aria-label="Choose an exercise">
    <div className="wk-picker-head"><input autoFocus className="wk-input" aria-label="Search exercises" placeholder="Search exercises, muscles, equipment" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="wk-btn wk-btn-icon" onClick={cancel} aria-label="Close exercise picker"><X size={18} /></button></div>
    <div className="wk-exercise-list">{results.map((exercise) => <button className="wk-exercise-row" key={exercise.id} onClick={() => choose(exercise)}><div><strong>{exercise.name}</strong><span>{exercise.target} · {exercise.equipment}</span></div><span className="wk-row-action">Add</span></button>)}</div>
  </section>
}

function ExerciseLibrary({ exercises, catalogStatus, openExercise, retryCatalog }) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('All')
  const [equipment, setEquipment] = useState('All')
  const [limit, setLimit] = useState(EXERCISE_PAGE_SIZE)
  useEffect(() => setLimit(EXERCISE_PAGE_SIZE), [query, muscle, equipment])
  const muscles = useMemo(() => ['All', ...new Set(exercises.map((exercise) => exercise.target).filter(Boolean))].sort(), [exercises])
  const equipmentOptions = useMemo(() => ['All', ...new Set(exercises.map((exercise) => exercise.equipment).filter(Boolean))].sort(), [exercises])
  const filtered = exercises.filter((exercise) => (muscle === 'All' || exercise.target === muscle) && (equipment === 'All' || exercise.equipment === equipment) && exerciseSearchText(exercise).includes(query.trim().toLowerCase()))
  return <section aria-label="Exercise library">
    <input className="wk-input wk-search" type="search" aria-label="Search exercises" placeholder="Search exercises, muscles, equipment" value={query} onChange={(event) => setQuery(event.target.value)} />
    <div className="wk-filter-row" role="group" aria-label="Filter exercises">
      <label><span className="wk-sr-only">Target muscle</span><select className="wk-select" value={muscle} onChange={(event) => setMuscle(event.target.value)}>{muscles.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span className="wk-sr-only">Equipment</span><select className="wk-select" value={equipment} onChange={(event) => setEquipment(event.target.value)}>{equipmentOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="wk-library-summary"><span>{filtered.length} matching exercises</span>{catalogStatus.state === 'loading' && <span>Syncing {catalogStatus.loaded}/{catalogStatus.total}</span>}{catalogStatus.state === 'partial' && <span>{catalogStatus.loaded} saved</span>}{catalogStatus.state === 'error' && <span>Catalogue unavailable</span>}</div>
    {(catalogStatus.state === 'partial' || catalogStatus.state === 'error') && <div className="wk-catalog-resume"><p>{catalogStatus.loaded ? 'Loading paused, but everything already saved is ready to use.' : 'The full exercise catalogue could not load yet.'}</p><button className="wk-btn wk-btn-secondary" onClick={retryCatalog}>Continue loading</button></div>}
    <div className="wk-exercise-list">{filtered.slice(0, limit).map((exercise) => <button className="wk-exercise-row" key={exercise.id} onClick={() => openExercise(exercise)}><div><strong>{exercise.name}</strong><span>{exercise.target} · {exercise.equipment}</span></div><span className="wk-row-action">View</span></button>)}</div>
    {limit < filtered.length && <button className="wk-btn wk-btn-secondary wk-btn-block wk-load-more" onClick={() => setLimit((current) => current + EXERCISE_PAGE_SIZE)}>Show {Math.min(EXERCISE_PAGE_SIZE, filtered.length - limit)} more</button>}
    <p className="wk-credit">Exercise data and animated demonstrations from <a href="https://oss.exercisedb.dev/docs" target="_blank" rel="noreferrer">{EXERCISEDB_CREDIT}</a>.</p>
  </section>
}

function ExerciseDetail({ exercise, state, close }) {
  return <div className="wk-detail" role="dialog" aria-modal="true" aria-label={exercise.name}>
    <header className="wk-header"><div className="wk-brand"><ExerciseMark exercise={exercise} /><div className="wk-brand-text"><h2 className="wk-title">{exercise.name}</h2><span className="wk-subtitle">{exercise.target} · {exercise.equipment}</span></div></div><div className="wk-header-right"><button className="wk-btn wk-btn-icon" onClick={close} aria-label="Close exercise"><X size={19} /></button></div></header>
    <div className="wk-detail-scroll">
      {exercise.imageData ? <img className="wk-gif" src={exercise.imageData} alt={`${exercise.name} animated demonstration`} /> : <div className="wk-media-state">{state === 'loading' ? 'Loading demonstration…' : 'Demonstration unavailable'}</div>}
      <dl className="wk-detail-facts"><div><dt>Target</dt><dd>{exercise.target}</dd></div><div><dt>Body part</dt><dd>{exercise.bodyPart}</dd></div><div><dt>Equipment</dt><dd>{exercise.equipment}</dd></div></dl>
      <h3>How to perform</h3>
      {exercise.instructions?.length ? <ol className="wk-instructions">{exercise.instructions.map((instruction, index) => <li key={index}>{instruction.replace(/^Step:\d+\s*/, '')}</li>)}</ol> : <p className="wk-muted-copy">Instructions are unavailable for this exercise.</p>}
      <p className="wk-credit">Exercise data and animation from <a href="https://oss.exercisedb.dev/docs" target="_blank" rel="noreferrer">{EXERCISEDB_CREDIT}</a>.</p>
    </div>
  </div>
}

function RoutineBuilder({ value, setValue, exercises, close, save }) {
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const choose = (exercise) => {
    setValue((current) => ({ ...current, exercises: [...current.exercises, { exerciseId: exercise.id, sets: 3, targetReps: 8, restSeconds: 90 }] }))
    setPicking(false)
    setQuery('')
  }
  return <div className="wk-detail" role="dialog" aria-modal="true" aria-label="Routine builder">
    <header className="wk-header"><div className="wk-brand"><div className="wk-brand-text"><h2 className="wk-title">Build routine</h2><span className="wk-subtitle">Reusable sets, reps, and rest</span></div></div><div className="wk-header-right"><button className="wk-btn wk-btn-icon" onClick={close} aria-label="Close routine builder"><X size={19} /></button><button className="wk-btn wk-btn-primary" disabled={!value.name.trim() || value.exercises.length === 0} onClick={save}>Save</button></div></header>
    <div className="wk-detail-scroll">
      <label className="wk-field"><span>Routine name</span><input className="wk-input" value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></label>
      <div className="wk-builder-list">{value.exercises.map((item, index) => {
        const exercise = exercises.find((candidate) => candidate.id === item.exerciseId)
        return <div className="wk-builder-item" key={`${item.exerciseId}-${index}`}><div className="wk-builder-name"><strong>{exercise?.name}</strong><span>{exercise?.target} · {exercise?.equipment}</span></div><label><span>Sets</span><input className="wk-input" inputMode="numeric" aria-label={`Sets for ${exercise?.name}`} value={item.sets} onChange={(event) => updateRoutineExercise(setValue, index, 'sets', event.target.value)} /></label><label><span>Reps</span><input className="wk-input" inputMode="numeric" aria-label={`Reps for ${exercise?.name}`} value={item.targetReps} onChange={(event) => updateRoutineExercise(setValue, index, 'targetReps', event.target.value)} /></label><button className="wk-btn wk-btn-icon" aria-label={`Remove ${exercise?.name}`} onClick={() => setValue((current) => ({ ...current, exercises: current.exercises.filter((_, candidateIndex) => candidateIndex !== index) }))}><Trash size={17} /></button></div>
      })}</div>
      {picking ? <ExercisePicker exercises={exercises} query={query} setQuery={setQuery} choose={choose} cancel={() => setPicking(false)} /> : <button className="wk-btn wk-btn-secondary wk-btn-block" onClick={() => setPicking(true)}><Plus size={17} />Add exercise</button>}
    </div>
  </div>
}

function History({ state }) {
  if (!state.sessions.length) return <div className="wk-empty"><div className="wk-empty-title">Your history starts here</div><p className="wk-empty-text">Finish a workout and every completed set will appear as a structured record.</p></div>
  return <div className="wk-history">{[...state.sessions].reverse().map((session) => <article className="wk-history-row" key={session.id}><div><h3>{session.name}</h3><p>{new Date(session.finishedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</p></div><div className="wk-history-stats"><span>{duration(session.durationSeconds)}</span><span>{session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length} sets</span><span>{Math.round(volume(session))} {state.preferences.unit}</span></div></article>)}</div>
}

function ConfirmDiscard({ cancel, confirm }) {
  return <div className="wk-scrim" role="dialog" aria-modal="true" aria-label="Discard workout" onClick={cancel}><div className="wk-sheet" onClick={(event) => event.stopPropagation()}><h3 className="wk-sheet-title">Discard this workout?</h3><p className="wk-sheet-body">The in-progress sets will be removed. Completed workout history and routines stay untouched.</p><div className="wk-sheet-actions"><button className="wk-btn wk-btn-secondary" onClick={cancel}>Keep workout</button><button className="wk-btn wk-btn-danger" onClick={confirm}>Discard</button></div></div></div>
}

function exerciseSearchText(exercise) {
  return [exercise.name, exercise.target, exercise.bodyPart, exercise.equipment, ...(exercise.secondaryMuscles || [])].join(' ').toLowerCase()
}

function updateRoutineExercise(setValue, index, field, rawValue) {
  const value = Math.max(1, Math.min(99, Number(rawValue) || 1))
  setValue((current) => ({ ...current, exercises: current.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
}
