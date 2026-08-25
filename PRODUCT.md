# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Users
Everyday lifters who want to plan and record strength workouts quickly without learning a programming model or talking to an agent.
## Product Purpose
Workout makes routine planning, set-by-set logging, exercise guidance, and progress history immediate. Success means starting from a reusable template, seeing previous performance, finishing a session, and retaining a clear record without friction.
## Positioning
A polished consumer tracker whose complete structured data remains available in one documented, portable record for custom dashboards and future extensions.
## Operating Context
Primarily a phone in the gym: short glances, one-handed taps, numeric entry, unreliable connectivity, and repeated use of a small set of routines.
## Capabilities and Constraints
- Core: routines, active workout logging, history, and an exercise library.
- Logging: reusable exercise setup notes, previous-set values that can be copied with one tap, guarded completion, and recoverable rest timing.
- Progress: rolling training summaries and per-exercise best weight, estimated one-rep max, best session volume, and recent performances derived from completed sessions.
- Legacy empty session records remain visible in History but do not inflate rolling training totals.
- Discovery: equal-width equipment and muscle filters, progressive static thumbnails in both the library and picker, and preview-before-add exercise details.
- Navigation: read-only exercise and workout-log details use an adaptive sheet; routine editing retains explicit Cancel and Save actions.
- Exercise demonstrations use free ExerciseDB V1 with visible AscendAPI attribution.
- List thumbnails are cached still frames; animated media is requested only for the selected exercise detail.
- Saved workout data remains useful when exercise media is unavailable.
- Agent/chat capability is deliberately excluded.
- Records use stable IDs and a versioned documented shape.
## Brand Commitments
The product is Workout. Hevy is a functional reference, not a brand to copy. The voice is direct, calm, and gym-native.
## Product Principles
1. Logging speed beats configuration power in the primary flow.
2. Templates are reusable data, not fixed screens.
3. Previous performance belongs beside the set being entered.
4. Guidance enriches but never blocks a workout.
5. Data stays legible and directly readable by other Möbius apps through a stable read-only contract.
6. The library should feel visual without turning scrolling into a wall of autoplaying media.
7. Secondary views should dismiss naturally without competing header controls or unexplained close icons.
