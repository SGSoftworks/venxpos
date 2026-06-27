# QA Bugfix Report — VenxPos

| ID | Severity | Bug | Root Cause | Fix | Status |
|---|---|---|---|---|---|
| B1 | **P0** | Login requires reload to function | `App.tsx` called `setSession()` *before* `restoreSession()`. If Supabase session was expired/invalid, Zustand state already showed logged in, rendering POSLayout with unauthenticated client. | Moved `setSession()` after `restoreSession()`. `restoreSession` now returns `boolean` — only sets session if restore succeeded. On failure, `local_session` is cleared so Login screen shows. (`App.tsx`, `syncWorker.ts`) | ✅ |
| B2 | **P0** | Branch switch only works once | `adminSwitch` used closure-bound `session` which could be stale. `downloadBranchData` had no error handling for Supabase queries — silent failures on re-auth. Data tables deleted before verifying download succeeded, leaving DB empty. | Switched to `useAppStore.getState().session` for fresh reads. Added `useRef` for `pendingBranch`. Added `Promise.all` + error checks for all Supabase queries. Wrapped data replacement in `BEGIN/COMMIT`. (`BranchSelector.tsx`) | ✅ |
| B3 | **P0** | Cash register always appears closed | `checkApertura` effect depended on `session` object reference — trivial re-renders (e.g., state changes in other components) could cause unnecessary re-checks if Zustand returned a new reference. | Added `checkedBranchRef` tracking last-checked `sucursal_id`. Added `currentAperturaId` guard — if already open on the same branch, skip re-check. (`POSLayout.tsx`) | ✅ |
| B4 | **P1** | ESC key does not close modals | Only `FreeSaleModal`, `PaymentModal`, and `WeightModal` had ESC handlers. `AdminOverrideModal`, `ReturnModal`, `CashRegisterClose`, `QuickStockAdjust` had none. | Added `useEffect` with `keydown` listener to each missing modal, calling `onClose`/`onCancel` on Escape. (`AdminOverrideModal.tsx`, `ReturnModal.tsx`, `CashRegisterClose.tsx`, `QuickStockAdjust.tsx`) | ✅ |
| B5 | **P1** | FreeSale fails with "Seleccione categoria" after selection | `CATEGORIES` in `FreeSaleModal` had `VL-ABARROTES` which was not created by `ensureVirtualProducts` in sync worker. Also, virtual products are created in Supabase but never synced to `local_productos` — so on first login they don't exist locally. | FreeSaleModal now falls back to Supabase query + local INSERT ON IGNORE when local products are missing. (`FreeSaleModal.tsx`) | ✅ |
| B6 | **P2** | No keyboard shortcuts reference | Users had no discoverable way to learn F1–F12, arrow, ESC shortcuts except action bar hints. | Created `KeyboardShortcutsModal.tsx` with complete shortcut list. Added ⌨ button in topbar. (`KeyboardShortcutsModal.tsx`, `POSLayout.tsx`) | ✅ |
| B7 | **P2** | Focus not returned after WeightModal/FreeSaleModal close | These modals didn't call `searchInputRef.current?.focus()` on close, requiring manual click to resume scanning. | Added `.focus()` calls to `onConfirm`/`onCancel` of WeightModal and `onClose` of FreeSaleModal. (`POSLayout.tsx`) | ✅ |

## Files Modified

| File | Changes |
|---|---|
| `src/App.tsx` | `setSession` moved after successful `restoreSession`; stale session cleanup |
| `src/lib/syncWorker.ts` | `restoreSession` returns `boolean`, validates `setSession` result |
| `src/components/Login.tsx` | Removed redundant `restoreSession` call (Supabase already has session from `signInWithPassword`) |
| `src/components/BranchSelector.tsx` | Stale closure fix; error handling in `downloadBranchData`; transaction wrapping |
| `src/components/POSLayout.tsx` | Apertura re-check guard; focus return on modal close; keyboard shortcuts modal + button |
| `src/components/AdminOverrideModal.tsx` | ESC → onCancel handler |
| `src/components/CashRegisterClose.tsx` | ESC → onClose handler |
| `src/components/ReturnModal.tsx` | ESC → onClose handler |
| `src/components/QuickStockAdjust.tsx` | ESC → onClose handler |
| `src/components/FreeSaleModal.tsx` | Fallback to Supabase + local insert for missing virtual products |
| `src/components/KeyboardShortcutsModal.tsx` | **New** — shortcut reference modal |

## Build / Lint Status

- `npm run build`: ✅ passes (0 errors)
- `npm run lint`: ✅ passes (0 errors, 2 pre-existing warnings: `POSLayout.tsx:410`, `SaleHistory.tsx:46`)

## Remaining for Production Readiness

1. **Manual QA cycle** — full walkthrough: Login → Branch switch → Cash open → Sale → FreeSale → Weight → Payment → Reports → Return → Close
2. **Inventory manual create/edit** form (category selector, stock initial, scanner-friendly search) — separate P2 sprint
3. **Navigation consistency** review (modals vs panels) — acceptable for single-screen POS, defer to P3
## B7-B12 Closure Update - 2026-06-19

| ID | Status | Fix / Deliverable |
|---|---|---|
| B7 | Done | Hook dependency warnings removed; modal keyboard handlers remain active; `AperturaTurnoModal` now receives `onCancel` from `POSLayout`. |
| B8 | Done | `POSLayout` now uses a single `activeView` state for Dashboard / Caja / Inventario / Resumen de cierre, preventing simultaneous main views. |
| B9 | Done | Added `DEAD_CODE_AUDIT.md` with unused assets and non-blocking import/chunk findings. |
| B10 | Done | Added professional splash in `App.tsx` with VENXPOS logo, staged status text and smooth fade/scale animation. |
| B11 | Done | Added `ShiftCloseSummary.tsx`; closing cash now shows turno summary with print and Volver al Login actions instead of immediate logout. |
| B12 | Technical QA done | `npm.cmd run lint` OK; `npm.cmd run build` OK. Manual Tauri/Supabase/printer QA remains required. |
