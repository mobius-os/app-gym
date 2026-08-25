export const SCHEMA_VERSION = 5
const LEGACY_EXERCISE_IDS = {
  'pull-up': '0V2YQjW',
  'shoulder-press': 'znQUdHY',
  'cable-row': 'fUBheHs',
  'leg-press': '2Qh2J1e',
  'barbell-curl': '25GPyDY',
}
const canonicalExerciseId=id=>LEGACY_EXERCISE_IDS[id]||id
export const BUILTIN_EXERCISES = [
  {id:'EIeI8Vf',name:'Bench Press (Barbell)',bodyPart:'Chest',equipment:'Barbell',target:'Pectorals',gifUrl:'https://static.exercisedb.dev/media/EIeI8Vf.gif',instructions:['Plant your feet and set your upper back.','Lower the bar with control to your chest.','Press up while staying tight.']},
  {id:'qXTaZnJ',name:'Squat (Barbell)',bodyPart:'Legs',equipment:'Barbell',target:'Quads',gifUrl:'https://static.exercisedb.dev/media/qXTaZnJ.gif',instructions:['Brace before you descend.','Keep your whole foot planted.','Drive the floor away to stand.']},
  {id:'ila4NZS',name:'Deadlift (Barbell)',bodyPart:'Back',equipment:'Barbell',target:'Glutes',gifUrl:'https://static.exercisedb.dev/media/ila4NZS.gif',instructions:['Set the bar over mid-foot and brace.','Push through the floor with the bar close.','Stand tall without leaning back.']},
  {id:'0V2YQjW',name:'Pull Up (Neutral Grip)',bodyPart:'Back',equipment:'Body Weight',target:'Lats',source:'exercisedb-v1',instructions:['Start from a controlled hang.','Drive your elbows down.','Lower under control.']},
  {id:'znQUdHY',name:'Dumbbell Seated Shoulder Press',bodyPart:'Shoulders',equipment:'Dumbbell',target:'Delts',source:'exercisedb-v1'},
  {id:'fUBheHs',name:'Cable Seated Row',bodyPart:'Back',equipment:'Cable',target:'Upper Back',source:'exercisedb-v1'},
  {id:'2Qh2J1e',name:'Sled 45° Leg Press',bodyPart:'Upper Legs',equipment:'Sled Machine',target:'Glutes',source:'exercisedb-v1'},
  {id:'25GPyDY',name:'Barbell Curl',bodyPart:'Upper Arms',equipment:'Barbell',target:'Biceps',source:'exercisedb-v1'}
]
const routine=(id,name,ids)=>({id,name,updatedAt:new Date().toISOString(),exercises:ids.map(exerciseId=>({exerciseId,sets:3,targetReps:8,restSeconds:90}))})
export function defaultState(){return{schemaVersion:SCHEMA_VERSION,routines:[routine('upper','Upper body',['EIeI8Vf','fUBheHs','znQUdHY']),routine('lower','Lower body',['qXTaZnJ','ila4NZS','2Qh2J1e'])],sessions:[],customExercises:[],exerciseNotes:{},activeWorkout:null,preferences:{unit:'kg'}}}
const canonicalExerciseItems=items=>(items||[]).map(item=>({...item,exerciseId:canonicalExerciseId(item.exerciseId)}))
const canonicalRoutine=item=>({...item,exercises:canonicalExerciseItems(item.exercises)})
const canonicalSession=item=>({...item,exercises:canonicalExerciseItems(item.exercises)})
function canonicalNotes(notes){const next={};for(const[id,value]of Object.entries(notes||{}))next[canonicalExerciseId(id)]=value;return next}
export function normalizeState(v){const b=defaultState();if(!v||typeof v!=='object')return b;const routines=Array.isArray(v.routines)?v.routines.map(canonicalRoutine):b.routines;const sessions=Array.isArray(v.sessions)?v.sessions.map(canonicalSession):[];const activeWorkout=v.activeWorkout&&typeof v.activeWorkout==='object'?canonicalSession(v.activeWorkout):null;const notes=v.exerciseNotes&&typeof v.exerciseNotes==='object'&&!Array.isArray(v.exerciseNotes)?canonicalNotes(v.exerciseNotes):{};return{...b,...v,schemaVersion:SCHEMA_VERSION,routines,sessions,customExercises:Array.isArray(v.customExercises)?v.customExercises:[],exerciseNotes:notes,activeWorkout,preferences:{...b.preferences,...(v.preferences||{})}}}
export function allExercises(s,remote=[]){const m=new Map();[...remote,...BUILTIN_EXERCISES,...(s.customExercises||[])].forEach(x=>m.set(x.id,x));return[...m.values()].sort((a,b)=>a.name.localeCompare(b.name))}
export function findExercise(s,id,remote=[]){const canonicalId=canonicalExerciseId(id);return allExercises(s,remote).find(x=>x.id===canonicalId)||{id:canonicalId,name:'Unknown exercise',bodyPart:'Other',equipment:'Other',target:'—'}}
export function familiarExerciseIds(s,limit=6){const ids=[],seen=new Set();const add=id=>{if(!id||seen.has(id)||ids.length>=limit)return;seen.add(id);ids.push(id)};for(const session of [...(s.sessions||[])].reverse())for(const exercise of session.exercises||[])add(exercise.exerciseId);for(const exercise of s.activeWorkout?.exercises||[])add(exercise.exerciseId);for(const routine of s.routines||[])for(const exercise of routine.exercises||[])add(exercise.exerciseId);return ids}
export function lastSetsFor(s,id){for(const session of [...s.sessions].reverse()){const ex=session.exercises?.find(x=>x.exerciseId===id);const sets=(ex?.sets||[]).filter(set=>set.completed!==false);if(sets.length)return sets}return[]}
export function startWorkout(r=null){return{id:crypto.randomUUID(),routineId:r?.id||null,name:r?.name||'Quick workout',startedAt:new Date().toISOString(),restTimer:null,exercises:(r?.exercises||[]).map(x=>({exerciseId:x.exerciseId,restSeconds:x.restSeconds||90,sets:Array.from({length:x.sets||3},(_,i)=>({id:crypto.randomUUID(),weight:'',reps:x.targetReps||'',completed:false}))}))}}
export function replaceWorkoutExercise(active,index,exerciseId){const source=active.exercises[index];if(!source)return active;const replacement={...source,exerciseId,sets:source.sets.map(()=>({id:crypto.randomUUID(),weight:'',reps:'',completed:false}))};return{...active,restTimer:active.restTimer?.exerciseId===source.exerciseId?null:active.restTimer,exercises:active.exercises.map((item,itemIndex)=>itemIndex===index?replacement:item)}}
export function moveWorkoutExercise(active,from,to){if(from<0||to<0||from>=active.exercises.length||to>=active.exercises.length||from===to)return active;const exercises=[...active.exercises];const[item]=exercises.splice(from,1);exercises.splice(to,0,item);return{...active,exercises}}
export function removeWorkoutExercise(active,index){const source=active.exercises[index];if(!source)return active;return{...active,restTimer:active.restTimer?.exerciseId===source.exerciseId?null:active.restTimer,exercises:active.exercises.filter((_,itemIndex)=>itemIndex!==index)}}
export function finishWorkout(a){const{restTimer,...workout}=a;return{...workout,finishedAt:new Date().toISOString(),durationSeconds:Math.max(1,Math.round((Date.now()-new Date(a.startedAt))/1000))}}
export const volume=s=>(s.exercises||[]).flatMap((item,index)=>completedSetEntries(item,index)).reduce((n,x)=>n+(+x.weight||0)*(+x.reps||0),0)
export const duration=s=>{const m=Math.max(1,Math.round(s/60));return m<60?`${m} min`:`${Math.floor(m/60)}h ${m%60}m`}
export function trainingSnapshot(s,now=Date.now()){const day=86400000,recentStart=now-(7*day),previousStart=now-(14*day);const finishedAt=x=>new Date(x.finishedAt||x.startedAt||0).getTime();const completedSets=x=>(x.exercises||[]).flatMap((e,i)=>completedSetEntries(e,i)).length;const inWindow=(start,end)=>(s.sessions||[]).map(session=>({session,completedSets:completedSets(session)})).filter(({session,completedSets:sets})=>{const t=finishedAt(session);return sets>0&&t>=start&&t<=end});const recent=inWindow(recentStart,now);const previous=inWindow(previousStart,recentStart-1);const recentSets=recent.reduce((n,x)=>n+x.completedSets,0);const previousSets=previous.reduce((n,x)=>n+x.completedSets,0);return{workouts:recent.length,completedSets:recentSets,trainingVolume:recent.reduce((n,x)=>n+volume(x.session),0),setDelta:recentSets-previousSets}}
export function estimatedOneRepMax(weight,reps){const value=Number(weight)||0,count=Number(reps)||0;return value>0&&count>0?value*(1+(count/30)):0}
const analyticsCache=new WeakMap()

function completedSetEntries(item,exerciseIndex){
  return(item.sets||[])
    .map((set,setIndex)=>({...set,setIndex,exerciseIndex}))
    .filter(set=>set.completed!==false&&Number(set.reps)>0)
}

function strongestSet(sets){
  let bestSet=null
  for(const set of sets){
    const weight=Number(set.weight)||0
    const reps=Number(set.reps)||0
    const e1rm=estimatedOneRepMax(weight,reps)
    if(!bestSet||e1rm>bestSet.e1rm||(e1rm===bestSet.e1rm&&weight>bestSet.weight)){
      bestSet={setId:set.id||null,setIndex:set.setIndex,exerciseIndex:set.exerciseIndex,weight,reps,e1rm}
    }
  }
  return bestSet
}

function buildWorkoutAnalytics(state){
  const seriesByExercise=new Map()
  const logsBySession=new Map()
  const previousByExercise=new Map()
  const sessions=(state.sessions||[])
    .map((session,sessionIndex)=>({session,sessionIndex}))
    .sort((a,b)=>new Date(a.session.finishedAt||a.session.startedAt||0)-new Date(b.session.finishedAt||b.session.startedAt||0)||a.sessionIndex-b.sessionIndex)

  for(const{session,sessionIndex}of sessions){
    const groups=new Map()
    for(const[itemIndex,item]of(session.exercises||[]).entries()){
      const sets=completedSetEntries(item,itemIndex)
      if(!sets.length)continue
      const group=groups.get(item.exerciseId)||[]
      group.push(...sets)
      groups.set(item.exerciseId,group)
    }

    const recordByExercise=new Map()
    for(const[exerciseId,sets]of groups){
      const bestSet=strongestSet(sets)
      const previous=previousByExercise.get(exerciseId)||{bestE1rm:0,bestWeight:0,workouts:0}
      const bestWeight=sets.reduce((maximum,set)=>Math.max(maximum,Number(set.weight)||0),0)
      const point={
        sessionId:session.id,
        sessionIndex,
        finishedAt:session.finishedAt||session.startedAt,
        completedSets:sets.length,
        volume:sets.reduce((total,set)=>total+((Number(set.weight)||0)*(Number(set.reps)||0)),0),
        bestWeight,
        bestSet,
        previousBestE1rm:previous.bestE1rm,
        previousBestWeight:previous.bestWeight,
        isBaseline:previous.workouts===0,
        isRecord:previous.workouts>0&&bestSet.e1rm>previous.bestE1rm,
      }
      const series=seriesByExercise.get(exerciseId)||[]
      series.push(point)
      seriesByExercise.set(exerciseId,series)
      if(point.isRecord){
        recordByExercise.set(exerciseId,{
          exerciseIndex:bestSet.exerciseIndex,
          setIndex:bestSet.setIndex,
          label:bestSet.weight>previous.bestWeight?'Weight PR':'Performance PR',
        })
      }
      previousByExercise.set(exerciseId,{
        bestE1rm:Math.max(previous.bestE1rm,bestSet.e1rm),
        bestWeight:Math.max(previous.bestWeight,bestWeight),
        workouts:previous.workouts+1,
      })
    }

    const exercises=(session.exercises||[]).flatMap((item,itemIndex)=>{
      const sets=completedSetEntries(item,itemIndex)
      if(!sets.length)return[]
      const record=recordByExercise.get(item.exerciseId)
      return[{
        exerciseId:item.exerciseId,
        sets:sets.map(set=>{
          const isPersonalRecord=Boolean(record&&record.exerciseIndex===itemIndex&&record.setIndex===set.setIndex)
          return{...set,isPersonalRecord,recordLabel:isPersonalRecord?record.label:null}
        }),
      }]
    })
    logsBySession.set(session.id,{
      session,
      exercises,
      recordCount:exercises.reduce((total,exercise)=>total+exercise.sets.filter(set=>set.isPersonalRecord).length,0),
    })
  }
  return{seriesByExercise,logsBySession}
}

function workoutAnalytics(state){
  if(!state||typeof state!=='object')return buildWorkoutAnalytics({sessions:[]})
  let analytics=analyticsCache.get(state)
  if(!analytics){
    analytics=buildWorkoutAnalytics(state)
    analyticsCache.set(state,analytics)
  }
  return analytics
}

export function exerciseProgress(s,id){
  const series=workoutAnalytics(s).seriesByExercise.get(id)||[]
  const best=series.reduce((current,session)=>!current||session.bestSet.e1rm>current.e1rm?session.bestSet:current,null)
  return{workouts:series.length,bestWeight:series.reduce((max,session)=>Math.max(max,session.bestWeight),0),bestE1rm:best?.e1rm||0,bestSessionVolume:series.reduce((max,session)=>Math.max(max,session.volume),0),series,recent:[...series].reverse().slice(0,4)}
}
export function isPersonalRecord(s,id,set){const progress=exerciseProgress(s,id);return Boolean(set?.completed&&Number(set.reps)>0&&progress.workouts>0&&estimatedOneRepMax(set.weight,set.reps)>progress.bestE1rm)}
export function sessionLogs(s){return workoutAnalytics(s).logsBySession}
export function sessionLog(s,sessionId){
  return sessionLogs(s).get(sessionId)||null
}
export function apiExercise(x){const title=v=>String(v).replace(/\b\w/g,c=>c.toUpperCase());return{id:x.exerciseId,name:title(x.name),gifUrl:x.gifUrl,bodyPart:title(x.bodyParts?.[0]||'Other'),equipment:title(x.equipments?.[0]||'Other'),target:title(x.targetMuscles?.[0]||'—'),instructions:x.instructions||[]}}
