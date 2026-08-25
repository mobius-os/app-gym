# Workout

A simple routine planner and set-by-set training log. Workout deliberately has no embedded agent: the primary experience is a fast, familiar workout flow.

All product state lives in `workout_state.json`: `routines[]`, completed `sessions[]`, `customExercises[]`, the recoverable `activeWorkout`, and `preferences`. Stable IDs and `schemaVersion` make dashboards and extensions straightforward.

Workout is the sole writer and declares `share_with_apps: "read"`. Other Möbius apps with cross-app read access can resolve the installed app whose slug is `workout` and consume its `workout_state.json` directly; no manual export flow or duplicate shared copy is required. Consumers should treat unknown fields as additive and branch on `schemaVersion` for migrations.

The full ExerciseDB list is cached separately in `exercise_catalog.json`. It is reference data, not part of the user's training record. List rows contain compact metadata only; the full instructions and GIF are requested when the owner opens one exercise.

Exercise information and GIF demonstrations come from the free [ExerciseDB V1 API by AscendAPI](https://oss.exercisedb.dev/docs). Media loads on demand and workout records remain useful without it.
