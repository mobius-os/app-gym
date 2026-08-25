# Workout

Workout is a fast, phone-first routine planner and set-by-set strength-training log for Möbius. It deliberately has no embedded agent: the primary experience is a familiar workout flow that remains useful offline and recovers an unfinished session.

## Product surface

- Create and edit reusable routines, or begin an empty workout.
- Log weight and reps beside the most recent matching set, then tap a previous value to copy it.
- Guard set completion until reps are present, recover automatic rest timers, and keep setup notes per exercise.
- Browse a progressively cached ExerciseDB catalogue with equipment and muscle filters. Rows load one still thumbnail near the viewport; animated demonstrations load only inside the selected exercise sheet.
- Review completed sessions, personal records, estimated one-rep-max trends, exercise progress, and rolling seven-day totals derived only from sessions with completed work.
- Keep an active workout as a recoverable draft. Destructive discard always requires confirmation.

Workout inherits Möbius light and dark theme roles. Root navigation stays flat; read-only exercise and history details use an adaptive secondary sheet that floats on larger screens and dismisses downward on phones. Routine editing uses explicit Cancel and Save actions.

## Data contract

`workout_state.json` is the authoritative user record. It contains `routines[]`, completed `sessions[]`, `customExercises[]`, reusable `exerciseNotes`, the recoverable `activeWorkout`, and `preferences`. Stable IDs and `schemaVersion` make dashboards and extensions straightforward. Analytics and records are derived from completed sessions rather than copied into a second store.

Workout is the sole writer and declares `share_with_apps: "read"`. Other Möbius apps with cross-app read access can resolve the installed app whose slug is `workout` and read `workout_state.json` directly. Consumers must treat the record as read-only, accept additive unknown fields, and branch on `schemaVersion` for migrations. There is intentionally no manual export flow or duplicate shared copy.

`exercise_catalog.json` is separately cached reference data, not part of the training record. Saved workouts remain usable if catalogue or media fetching is unavailable.

## Exercise media

Exercise information and demonstrations come from the free [ExerciseDB V1 API by AscendAPI](https://oss.exercisedb.dev/docs). The app fetches this data through the Möbius proxy. It decodes and caches small first-frame thumbnails for visible rows, retries temporary service failures after a short pause, negatively caches missing official media for seven days, and fetches a full animation only after an exercise is selected. AscendAPI attribution remains visible in the detail view.

## Local verification

```sh
npm test
python3 "$SCRIPTS_DIR/validate-app.py" /data/apps/workout
```

The app is installed by applying its source directory with the standard Möbius app helper. `package.json` is only the local ESM test harness; `mobius.json` is the package manifest and names every shipped source file.

## License

MIT. See `LICENSE`.
