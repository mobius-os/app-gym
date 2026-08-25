---
name: Workout
description: A calm, gym-native training notebook for fast set-by-set logging.
colors:
  training-blue: "#1877f2"
  training-blue-hover: "#0865da"
  completion-green: "#35ae49"
  white: "#ffffff"
  media-neutral: "#f2f3f5"
typography:
  headline:
    fontFamily: "var(--font)"
    fontSize: "1.35rem"
    fontWeight: 700
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font)"
    fontSize: "1rem"
    fontWeight: 700
  body:
    fontFamily: "var(--font)"
    fontSize: "0.84rem"
    lineHeight: 1.5
  label:
    fontFamily: "var(--font)"
    fontSize: "0.64rem"
    fontWeight: 700
    letterSpacing: "normal"
rounded:
  field: "8px"
  set-row: "9px"
  control: "10px"
  card: "12px"
  empty-state: "14px"
  media: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  section: "30px"
components:
  button-primary:
    backgroundColor: "{colors.training-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.training-blue-hover}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
  input:
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "40px"
  chip-selected:
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  completion-toggle:
    backgroundColor: "{colors.completion-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.set-row}"
    size: "36px"
---

# Design System: Workout

## Overview

**Creative North Star: “The Open Training Notebook”**

Workout should feel like a training notebook already open to today’s work: immediate, legible, and ready for repeated use. It is a native-feeling utility rather than a dashboard, with quiet graphite surfaces, a single training-blue action voice, and list rows and set tables that keep the next action beside the information needed to take it.

The interface is dense enough for short glances in the gym but never cramped. Strong hierarchy, generous tap targets, and restrained feedback make one-handed logging dependable. Guidance and data ownership remain visible without competing with the workout itself.

**Key Characteristics:**
- White/graphite foundation with training blue reserved for actions and current state.
- Workout-native ledger patterns: routines, rows, previous values, sets, and completion marks.
- Compact typography, full-width mobile actions, and minimum 44px primary tap targets.
- Calm, direct feedback; motion reinforces state without becoming decoration.

## Colors

The palette is deliberately narrow: shell-provided neutrals establish the notebook, training blue supplies the action voice, and green appears only as evidence of completed work.

### Primary
- **Training Blue** (`#1877f2`): Primary actions, active navigation, linked exercise names, quiet actions, placeholders, and attribution links.
- **Pressed Training Blue** (`#0865da`): Hover treatment for primary actions; never a second independent accent.

### Secondary
- **Completion Green** (`#35ae49`): Completed-set controls and the subtle completed-row tint only.

### Neutral
- **Shell Background / Surface / Surface 2 / Text / Muted / Border** (`var(--bg)`, `var(--surface)`, `var(--surface-2)`, `var(--text)`, `var(--muted)`, `var(--border)`): Inherit these from the host so Workout remains native in light and dark appearances.
- **White** (`#ffffff`): Text on blue and green action fills.
- **Media Neutral** (`#f2f3f5`): Exercise demonstration backdrop.

### Named Rules
**The One Action Voice Rule.** Blue means actionable or current; green means completed. Do not introduce decorative accent colors.

**The Host-Neutral Rule.** Never hard-code the core background, surface, text, muted, or border palette. Those roles belong to the surrounding Möbius appearance.

## Typography

**Display Font:** None; Workout does not use oversized display type.  
**Body Font:** Host UI family (`var(--font)`)  
**Label Font:** Host UI family (`var(--font)`)

**Character:** Compact, sturdy, and utilitarian. Weight and proximity do the work; the system avoids ornamental type and oversized marketing hierarchy.

### Hierarchy
- **Headline** (700, `1.35rem`, tight `-0.025em` tracking): Sticky-screen titles only.
- **Title** (700, `0.96–1.05rem`): Section, routine, history, sheet, and card headings.
- **Body** (400, `0.8–0.9rem`, `1.45–1.55`): Descriptions, instructions, and supporting content.
- **Label** (700, `0.64–0.76rem`, uppercase only for set-column headings): Metadata, previous values, statistics, and table labels.
- **Control** (700–800): Buttons and linked exercise names; primary controls use `750` where variable weights are available.

### Named Rules
**The Glanceable Ledger Rule.** Labels stay small and quiet; the exercise, value, and next action remain visually dominant.

## Layout

The app is a centered single-column notebook capped at `780px`; full-screen detail and builder sheets use a tighter `720px` reading width. The sticky header holds a 64px title row and 48px tab row. Main content uses `20px` horizontal padding, `22px` top padding, and `30px` between major sections, with `90px` of bottom breathing room.

Routine and exercise collections are divided rows rather than card grids. The active workout is a ledger: five aligned columns for set number, previous performance, weight, reps, and completion. At `560px` and below, horizontal padding becomes `16px`, quick-start and routine layouts collapse to one column, set columns tighten, and exercise details stack. Navigation remains persistent and equally weighted.

## Elevation & Depth

The system is flat by design and uses no box shadows. Depth comes from sticky positioning, full-screen sheets, tonal surface changes, one-pixel borders, dividers, and state tints. A sheet replaces the canvas rather than floating as a card; the toast is the only overlay-like pill.

### Named Rules
**The Flat Ledger Rule.** Use borders, surface tones, and spatial containment before adding elevation. Shadows are not part of the incumbent language.

## Shapes

Corners communicate scale and purpose: fields use `8px`, set controls `9px`, buttons `10px`, cards `12px`, empty states `14px`, and media `16px`. Pills (`999px`) are reserved for filter chips and transient toasts; circular geometry is reserved for thumbnails, set numbers, and close controls. Lists remain square-edged and separated by rules so the notebook structure stays visible.

## Components

### Buttons
- **Shape:** Compact rounded rectangle (`10px`) with at least `44px` height for primary, secondary, and quiet actions.
- **Primary:** Training Blue with white text, `0 15px` padding, and strong `750` weight.
- **Hover / Focus:** Darken to Pressed Training Blue; use a three-pixel blue-tinted focus outline with `2px` offset. Primary and secondary buttons compress to `scale(.98)` when active.
- **Secondary:** Host secondary surface, text color, and one-pixel border; use for add/start actions that should not outrank Finish or Start routine.
- **Quiet:** Transparent blue text for Save, Remove, and link-like actions.

### Chips
- **Style:** Fully rounded filter controls with an outlined, muted default state and `8px 12px` padding.
- **State:** Selected chips invert to host text over host background. Keep the row horizontally scrollable rather than wrapping.

### Cards / Containers
- **Corner Style:** `12px` for data and detail-stat cards; `14px` for dashed empty states.
- **Background:** Host secondary surface for cards; rows generally remain on the page background.
- **Shadow Strategy:** None.
- **Border:** Dividers are one-pixel host borders; empty states use a dashed border.
- **Internal Padding:** `14px` in cards and `30px 18px` in empty states.

### Inputs / Fields
- **Style:** Host surface, one-pixel border, `8px` radius, `40px` height, and `12px` horizontal padding. Numeric set inputs are centered and bold.
- **Focus:** Three-pixel translucent Training Blue outline with `2px` offset.
- **State:** Completed set rows receive a restrained green surface tint; the underlying values remain fully legible.

### Navigation

The four tabs share the available width. Muted bold labels sit above a transparent two-pixel underline; the active tab changes both label and underline to Training Blue. On compact screens the labels shrink slightly rather than changing navigation mode.

### Set Ledger

The signature component aligns previous performance directly beside editable weight and reps. Set numbers are circular tonal markers, inputs are compact, and the completion control changes from neutral to solid green with a check. The whole completed row receives a low-strength green tint, making progress visible without disrupting the grid.

### Exercise Rows and Sheets

Exercise rows use a 48px circular thumbnail, strong name, muted target/equipment metadata, and a divider. Hover adds a secondary-surface wash and an `8px` leftward reveal. Exercise detail opens as a full-screen sheet with a contained media area and stacked facts on phones.

## Do's and Don'ts

### Do:
- **Do** keep the current workout and the next logging action in the first viewport.
- **Do** place previous performance beside each set’s current inputs.
- **Do** retain 44px tap targets for consequential or repeated actions.
- **Do** use Training Blue for action/current state and Completion Green only for completed work.
- **Do** inherit shell neutrals and type so light and dark appearances remain coherent.
- **Do** honor reduced-motion preferences by removing transitions.

### Don't:
- **Don't** turn the interface into an analytics dashboard or a wall of floating cards.
- **Don't** use shadows, gradients, ornamental type, or additional decorative accents.
- **Don't** hide logging behind configuration, guidance, or exercise media.
- **Don't** use pills for ordinary buttons or containers; reserve them for filters and transient status.
- **Don't** let narrow layouts wrap or misalign the set ledger’s core values.
