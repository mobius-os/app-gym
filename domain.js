export const SCHEMA_VERSION = 3
export const BUILTIN_EXERCISES = [
  {id:'EIeI8Vf',name:'Bench Press (Barbell)',bodyPart:'Chest',equipment:'Barbell',target:'Pectorals',gifUrl:'https://static.exercisedb.dev/media/EIeI8Vf.gif',instructions:['Plant your feet and set your upper back.','Lower the bar with control to your chest.','Press up while staying tight.']},
  {id:'qXTaZnJ',name:'Squat (Barbell)',bodyPart:'Legs',equipment:'Barbell',target:'Quads',gifUrl:'https://static.exercisedb.dev/media/qXTaZnJ.gif',instructions:['Brace before you descend.','Keep your whole foot planted.','Drive the floor away to stand.']},
  {id:'ila4NZS',name:'Deadlift (Barbell)',bodyPart:'Back',equipment:'Barbell',target:'Glutes',gifUrl:'https://static.exercisedb.dev/media/ila4NZS.gif',instructions:['Set the bar over mid-foot and brace.','Push through the floor with the bar close.','Stand tall without leaning back.']},
  {id:'pull-up',name:'Pull Up',bodyPart:'Back',equipment:'Body Weight',target:'Lats',instructions:['Start from a controlled hang.','Drive your elbows down.','Lower under control.']},
  {id:'shoulder-press',name:'Shoulder Press (Dumbbell)',bodyPart:'Shoulders',equipment:'Dumbbell',target:'Delts'},
  {id:'cable-row',name:'Seated Cable Row',bodyPart:'Back',equipment:'Cable',target:'Upper Back'},
  {id:'leg-press',name:'Leg Press',bodyPart:'Legs',equipment:'Machine',target:'Quads'},
  {id:'barbell-curl',name:'Biceps Curl (Barbell)',bodyPart:'Arms',equipment:'Barbell',target:'Biceps'}
]
const routine=(id,name,ids)=>({id,name,updatedAt:new Date().toISOString(),exercises:ids.map(exerciseId=>({exerciseId,sets:3,targetReps:8,restSeconds:90}))})
export function defaultState(){return{schemaVersion:SCHEMA_VERSION,routines:[routine('upper','Upper body',['EIeI8Vf','cable-row','shoulder-press']),routine('lower','Lower body',['qXTaZnJ','ila4NZS','leg-press'])],sessions:[],customExercises:[],activeWorkout:null,preferences:{unit:'kg'}}}
export function normalizeState(v){const b=defaultState();if(!v||typeof v!=='object')return b;return{...b,...v,schemaVersion:SCHEMA_VERSION,routines:Array.isArray(v.routines)?v.routines:b.routines,sessions:Array.isArray(v.sessions)?v.sessions:[],customExercises:Array.isArray(v.customExercises)?v.customExercises:[],preferences:{...b.preferences,...(v.preferences||{})}}}
export function allExercises(s,remote=[]){const m=new Map();[...remote,...BUILTIN_EXERCISES,...(s.customExercises||[])].forEach(x=>m.set(x.id,x));return[...m.values()].sort((a,b)=>a.name.localeCompare(b.name))}
export function findExercise(s,id,remote=[]){return allExercises(s,remote).find(x=>x.id===id)||{id,name:'Unknown exercise',bodyPart:'Other',equipment:'Other',target:'—'}}
export function lastSetsFor(s,id){for(const session of [...s.sessions].reverse()){const ex=session.exercises?.find(x=>x.exerciseId===id);if(ex)return ex.sets||[]}return[]}
export function startWorkout(r=null){return{id:crypto.randomUUID(),routineId:r?.id||null,name:r?.name||'Quick workout',startedAt:new Date().toISOString(),exercises:(r?.exercises||[]).map(x=>({exerciseId:x.exerciseId,restSeconds:x.restSeconds||90,sets:Array.from({length:x.sets||3},(_,i)=>({id:crypto.randomUUID(),weight:'',reps:x.targetReps||'',completed:false}))}))}}
export function finishWorkout(a){return{...a,finishedAt:new Date().toISOString(),durationSeconds:Math.max(1,Math.round((Date.now()-new Date(a.startedAt))/1000))}}
export const volume=s=>(s.exercises||[]).flatMap(x=>x.sets||[]).filter(x=>x.completed).reduce((n,x)=>n+(+x.weight||0)*(+x.reps||0),0)
export const duration=s=>{const m=Math.max(1,Math.round(s/60));return m<60?`${m} min`:`${Math.floor(m/60)}h ${m%60}m`}
export function apiExercise(x){const title=v=>String(v).replace(/\b\w/g,c=>c.toUpperCase());return{id:x.exerciseId,name:title(x.name),gifUrl:x.gifUrl,bodyPart:title(x.bodyParts?.[0]||'Other'),equipment:title(x.equipments?.[0]||'Other'),target:title(x.targetMuscles?.[0]||'—'),instructions:x.instructions||[]}}
