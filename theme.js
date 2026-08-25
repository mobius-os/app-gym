export const CSS = `
/* THESIS: Workout is a Möbius-native training ledger, not a fitness dashboard. OWN-WORLD: theme-token surfaces, compact headers, quiet rows, accent actions, and dense set tables. STORY: choose a routine, log beside previous values, inspect movement guidance only when needed, finish, and let other apps read the record. FIRST VIEWPORT: standard Möbius header and segmented navigation above quick start and routine rows. FORM: native utility app; seed workout-native-ledger. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */

/* mobius-ui:Focus v1 -- shared keyboard focus ring (WCAG 2.4.7); never bare outline:none */
:where(button,a,input,textarea,select,summary,[role="button"],[tabindex]:not([tabindex="-1"])):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
/* /mobius-ui:Focus */

/* mobius-ui:Root v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-root { position:relative; display:flex; flex-direction:column; height:100%; width:100%; max-width:100%; overflow:hidden; background:var(--bg); color:var(--text); font-family:var(--font); -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent; }
.wk-scroll { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; padding:20px 20px max(36px, env(safe-area-inset-bottom)); word-break:break-word; overflow-wrap:anywhere; }
/* /mobius-ui:Root */

/* mobius-ui:Header v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-header { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:48px; padding:max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 12px max(16px, env(safe-area-inset-left)); background:var(--surface); border-bottom:1px solid var(--border); }
.wk-brand { display:flex; align-items:center; gap:11px; min-width:0; }
.wk-brand-text { min-width:0; line-height:1.15; }
.wk-title { margin:0; font-size:18px; font-weight:700; letter-spacing:-0.015em; }
.wk-subtitle { display:block; margin-top:2px; font-size:12px; font-weight:500; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }
.wk-header-right { display:flex; align-items:center; gap:8px; flex:0 0 auto; }
/* /mobius-ui:Header */

/* mobius-ui:Segmented v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-seg { flex:0 0 auto; display:flex; gap:2px; height:44px; margin:10px 16px 0; background:var(--surface2, var(--surface)); border:0; border-radius:10px; box-shadow:inset 0 0 0 1px var(--border); }
.wk-seg-btn { box-sizing:border-box; flex:1; min-height:44px; padding:6px 14px; border:0; border-radius:7px; background:transparent; color:var(--muted); font-family:var(--font); font-size:13px; font-weight:650; cursor:pointer; transition:background .15s, color .15s; }
.wk-seg-btn:hover { color:var(--text); }
.wk-seg-btn.is-active { background:var(--bg); color:var(--text); box-shadow:0 1px 3px rgba(0,0,0,.18); }
/* /mobius-ui:Segmented */

/* mobius-ui:Button v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:44px; padding:10px 16px; border-radius:10px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-family:var(--font); font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; transition:background .14s ease, border-color .14s ease, transform .1s ease; }
.wk-btn:active { transform:scale(.97); }
.wk-btn:disabled { opacity:.5; cursor:default; transform:none; }
.wk-btn-primary { background:var(--accent); border-color:var(--accent); color:var(--accent-fg); }
.wk-btn-primary:hover { filter:brightness(1.06); }
.wk-btn-secondary { background:var(--surface2, var(--surface)); }
.wk-btn-secondary:hover { border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); }
.wk-btn-ghost { background:transparent; border-color:transparent; color:var(--accent); }
.wk-btn-ghost:hover { background:color-mix(in srgb,var(--accent) 10%,transparent); }
.wk-btn-danger { background:var(--danger); border-color:var(--danger); color:var(--accent-fg); }
.wk-btn-icon { width:44px; padding:0; border-radius:8px; }
.wk-btn-block { width:100%; }
/* /mobius-ui:Button */

/* mobius-ui:Input v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-input,.wk-select { display:block; width:100%; box-sizing:border-box; min-height:44px; padding:11px 12px; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:8px; font-family:var(--font); font-size:16px; line-height:1.5; transition:border-color .15s ease, box-shadow .15s ease; }
.wk-input::placeholder { color:var(--muted); }
.wk-input:focus,.wk-select:focus { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
/* /mobius-ui:Input */

/* mobius-ui:Empty v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-empty { display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; max-width:440px; margin:0 auto; padding:48px 24px; color:var(--muted); }
.wk-empty-title { font-size:17px; font-weight:700; color:var(--text); letter-spacing:-.01em; }
.wk-empty-text { margin:0; font-size:14px; line-height:1.6; }
/* /mobius-ui:Empty */

/* mobius-ui:Sheet v1 — keep in sync; library candidate. Diverge below the marker only. */
.wk-scrim { position:absolute; inset:0; z-index:100; display:flex; align-items:flex-end; justify-content:center; padding:16px; background:rgba(0,0,0,.5); }
.wk-sheet { width:100%; max-width:480px; max-height:85vh; overflow-y:auto; padding:24px 24px max(24px, env(safe-area-inset-bottom)); background:var(--surface); border:1px solid var(--border); border-radius:16px 16px 0 0; box-shadow:0 -8px 32px rgba(0,0,0,.3); }
.wk-sheet-title { margin:0 0 12px; font-size:16px; font-weight:700; letter-spacing:-.01em; }
.wk-sheet-body { margin:0 0 16px; font-size:14px; line-height:1.5; color:var(--muted); }
.wk-sheet-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:24px; }
.wk-sheet-actions .wk-btn { flex:1; }
/* /mobius-ui:Sheet */

.wk-loading { display:grid; min-height:100%; place-items:center; color:var(--muted); font-size:14px; }
.wk-section { margin:0 0 30px; }
.wk-section-title { margin:0 0 12px; font-size:15px; font-weight:700; letter-spacing:-.01em; }
.wk-section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:4px; }
.wk-section-heading .wk-section-title { margin:0; }
.wk-section-heading > span,.wk-library-summary { color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }
.wk-quick-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.wk-routine-list { border-top:1px solid var(--border); }
.wk-routine { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px 16px; align-items:center; padding:16px 0; border-bottom:1px solid var(--border); }
.wk-routine-main { min-width:0; }
.wk-routine h3,.wk-history-row h3 { margin:0 0 4px; font-size:15px; font-weight:700; letter-spacing:-.01em; }
.wk-routine p,.wk-history-row p { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0; color:var(--muted); font-size:12px; line-height:1.5; }

.wk-active-exercise { margin:0 0 28px; }
.wk-exercise-heading { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.wk-exercise-mark { flex:0 0 auto; display:grid; place-items:center; width:36px; height:36px; border-radius:10px; background:color-mix(in srgb,var(--accent) 14%,transparent); border:1px solid color-mix(in srgb,var(--accent) 26%,var(--border)); color:var(--accent); font-size:14px; font-weight:700; }
.wk-exercise-heading > button { display:flex; flex-direction:column; align-items:flex-start; min-width:0; padding:4px; border:0; background:transparent; color:var(--text); text-align:left; cursor:pointer; }
.wk-exercise-heading strong { color:var(--accent); font-size:14px; }
.wk-exercise-heading span { margin-top:2px; color:var(--muted); font-size:11px; }
.wk-set-head,.wk-set-row { display:grid; grid-template-columns:34px minmax(62px,1fr) 70px 70px 42px; gap:6px; align-items:center; }
.wk-set-head { padding:0 6px 5px; color:var(--muted); font-size:10px; font-weight:600; text-transform:uppercase; text-align:center; letter-spacing:.035em; }
.wk-set-head span:nth-child(2) { text-align:left; }
.wk-set-row { min-height:52px; padding:6px; border-radius:9px; transition:background .15s ease; }
.wk-set-row.is-complete { background:color-mix(in srgb,var(--green) 14%,var(--surface)); }
.wk-set-number { display:grid; place-items:center; width:28px; height:28px; border-radius:50%; background:var(--surface2, var(--surface)); font-size:12px; font-weight:700; }
.wk-previous { color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }
.wk-set-input { min-height:40px; height:40px; padding:6px 4px; text-align:center; font-weight:700; font-variant-numeric:tabular-nums; }
.wk-check { display:grid; place-items:center; width:38px; height:38px; border:1px solid var(--border); border-radius:9px; background:var(--surface2, var(--surface)); color:var(--muted); cursor:pointer; }
.wk-check:disabled { opacity:.42; cursor:not-allowed; }
.wk-check.is-complete { background:var(--green); border-color:var(--green); color:var(--accent-fg); }
.wk-add-set { display:flex; align-items:center; justify-content:center; gap:5px; width:calc(100% - 12px); min-height:40px; margin:5px 6px 0; border:0; border-radius:8px; background:var(--surface2, var(--surface)); color:var(--text); font-size:13px; font-weight:600; cursor:pointer; }

.wk-picker { margin-top:14px; padding:12px; border:1px solid var(--border); border-radius:12px; background:var(--surface); }
.wk-picker-head { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; margin-bottom:8px; }
.wk-exercise-list { border-top:1px solid var(--border); }
.wk-exercise-row { display:flex; align-items:center; justify-content:space-between; gap:14px; width:100%; min-height:58px; padding:10px 2px; border:0; border-bottom:1px solid var(--border); background:transparent; color:var(--text); text-align:left; cursor:pointer; transition:background .14s ease, padding .14s ease; }
.wk-exercise-row:hover { padding-left:8px; padding-right:8px; background:var(--surface2, var(--surface)); }
.wk-exercise-row > div { min-width:0; }
.wk-exercise-row strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:650; }
.wk-exercise-row span:not(.wk-row-action) { display:block; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--muted); font-size:12px; }
.wk-row-action { flex:0 0 auto; color:var(--accent); font-size:12px; font-weight:650; }
.wk-search { margin-bottom:10px; }
.wk-filter-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.wk-select { padding-right:28px; font-size:14px; }
.wk-library-summary { display:flex; justify-content:space-between; gap:12px; padding:10px 2px 8px; }
.wk-catalog-resume { display:flex; align-items:center; justify-content:space-between; gap:14px; margin:2px 0 12px; padding:12px; border:1px solid var(--border); border-radius:10px; background:var(--surface2, var(--surface)); }
.wk-catalog-resume p { margin:0; color:var(--muted); font-size:12px; line-height:1.45; }
.wk-catalog-resume .wk-btn { flex:0 0 auto; }
.wk-load-more { margin-top:14px; }

.wk-detail { position:absolute; inset:0; z-index:60; display:flex; flex-direction:column; overflow:hidden; background:var(--bg); color:var(--text); }
.wk-detail-scroll { flex:1; min-height:0; overflow-y:auto; padding:20px 20px max(40px, env(safe-area-inset-bottom)); }
.wk-gif { display:block; width:100%; max-height:380px; object-fit:contain; border-radius:12px; background:#fff; border:1px solid var(--border); }
.wk-media-state { display:grid; place-items:center; min-height:220px; border:1px dashed var(--border); border-radius:12px; background:var(--surface2, var(--surface)); color:var(--muted); font-size:13px; }
.wk-detail-facts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:18px 0 24px; }
.wk-detail-facts div { min-width:0; padding:12px; border:1px solid var(--border); border-radius:10px; background:var(--surface); }
.wk-detail-facts dt { margin-bottom:4px; color:var(--muted); font-size:11px; }
.wk-detail-facts dd { overflow:hidden; margin:0; text-overflow:ellipsis; font-size:13px; font-weight:650; }
.wk-detail-scroll h3 { margin:24px 0 10px; font-size:15px; }
.wk-instructions { margin:0; padding-left:22px; color:var(--muted); font-size:14px; line-height:1.55; }
.wk-instructions li { margin-bottom:9px; }
.wk-muted-copy,.wk-credit { color:var(--muted); font-size:13px; line-height:1.55; }
.wk-credit { margin:26px 0 0; }
.wk-credit a { color:var(--accent); }

.wk-field { display:block; margin-bottom:20px; }
.wk-field > span,.wk-builder-item label > span { display:block; margin-bottom:6px; color:var(--muted); font-size:12px; font-weight:600; }
.wk-builder-list { margin-bottom:14px; border-top:1px solid var(--border); }
.wk-builder-item { display:grid; grid-template-columns:minmax(0,1fr) 70px 70px 44px; gap:8px; align-items:end; padding:14px 0; border-bottom:1px solid var(--border); }
.wk-builder-name { align-self:center; min-width:0; }
.wk-builder-name strong,.wk-builder-name span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.wk-builder-name strong { font-size:14px; }
.wk-builder-name span { margin-top:3px; color:var(--muted); font-size:11px; }
.wk-builder-item .wk-input { min-height:44px; text-align:center; padding-inline:6px; }

.wk-history { border-top:1px solid var(--border); }
.wk-history-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; padding:15px 0; border-bottom:1px solid var(--border); }
.wk-history-stats { display:flex; justify-content:flex-end; gap:12px; color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums; }
.wk-toast,.wk-sync-pill { position:absolute; z-index:110; right:14px; bottom:max(14px, env(safe-area-inset-bottom)); padding:8px 12px; border:1px solid var(--border); border-radius:999px; background:var(--surface); color:var(--text); box-shadow:0 2px 8px rgba(0,0,0,.18); font-size:12px; font-weight:600; }
.wk-sync-pill.is-error { color:var(--danger); }
.wk-sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

@media (min-width: 820px) {
  .wk-scroll,.wk-detail-scroll { width:min(100%,780px); margin-inline:auto; }
  .wk-header,.wk-seg { width:min(calc(100% - 32px),780px); margin-inline:auto; }
  .wk-header { width:100%; padding-inline:max(calc((100% - 780px)/2),20px); }
}
@media (max-width: 560px) {
  .wk-scroll,.wk-detail-scroll { padding-inline:16px; }
  .wk-quick-actions { grid-template-columns:1fr; }
  .wk-routine { grid-template-columns:1fr; }
  .wk-routine .wk-btn { width:100%; }
  .wk-set-head,.wk-set-row { grid-template-columns:30px minmax(54px,1fr) 62px 62px 38px; gap:4px; }
  .wk-filter-row { grid-template-columns:1fr; }
  .wk-catalog-resume { align-items:stretch; flex-direction:column; }
  .wk-catalog-resume .wk-btn { width:100%; }
  .wk-detail-facts { grid-template-columns:1fr; }
  .wk-builder-item { grid-template-columns:minmax(0,1fr) 58px 58px 44px; }
  .wk-header-right { gap:4px; }
  .wk-header-right .wk-btn:not(.wk-btn-icon) { padding-inline:11px; }
  .wk-history-row { grid-template-columns:1fr; }
  .wk-history-stats { justify-content:flex-start; }
}

/* mobius-ui:ReducedMotion v1 — keep in sync; library candidate. Diverge below the marker only. */
@media (prefers-reduced-motion: reduce) { .wk-btn,.wk-seg-btn,.wk-set-row,.wk-exercise-row,.wk-input,.wk-select { transition:none !important; } }
/* /mobius-ui:ReducedMotion */
`
