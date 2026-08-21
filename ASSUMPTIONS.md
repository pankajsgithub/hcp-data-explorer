# Technical Assumptions & Architecture Decisions

---

## 1. Data Modeling & Aggregation (FR-1, FR-2, FR-7)

* **Dirty Data & Coercion:**
  * The starter generator intentionally injects non-numeric string values (e.g. `"35"`) for numeric fields. 
  * Aggregation logic sanitizes all incoming numeric fields (`calls`, `trx`, `nrx`) via defensive parsing (`Number(val) || 0`) to prevent `NaN` propagation across subtotals.
* **CPI Division Safety:**
  * Cost Per Interaction ($\text{CPI} = \frac{\text{Calls}}{\text{TRx}} \times 100$) returns `null` whenever $\text{TRx} = 0$, preventing `Infinity` or `NaN` errors.
  * In the UI, `null` CPI values are rendered as `"—"`.
* **Subtotal Aggregation Exclusions:**
  * In-flight (`pending`) edits are strictly excluded from group rollups (Region and Territory totals) until validated and transitioned to `saved`.
  * Reverted (`rejected`) edits never modify the underlying tree totals.

---

## 2. Virtualization & Tree Layout (FR-2, FR-6)

* **Flat Indexed Rendering:**
  * Rather than rendering nested DOM nodes (which breaks virtualization window calculations), the multi-level tree hierarchy (Region $\rightarrow$ Territory $\rightarrow$ HCP Record) is flattened into a 1D array (`FlatGridItem[]`).
  * Group items calculate dynamic row heights (40px for Region/Territory headers vs 36px for leaf rows), enabling accurate sizing via `@tanstack/react-virtual`.
* **Sticky Group Headers:**
  * Group headers use sticky CSS positioning (`top: 0`) and elevated `z-index` layering to ensure clear visual hierarchy during continuous scrolling across 50,000+ records.

---

## 3. Concurrency, Async Lifecycle & Undo/Redo (FR-4)

* **Command Pattern vs Full-State Snapshots:**
  * To avoid heavy memory allocation and garbage collection freezes with 50,000 records, undo/redo uses delta command actions: `{ cellKey, prevValue, nextValue }`.
  * Only committed (`saved`) edits are pushed onto the undo stack.
* **Transient 503 / Network Error Handling:**
  * The asynchronous validator randomly injects `503 Service Unavailable` errors.
  * When a `503` or validation constraint (e.g. $Calls > 60$ or negative values) occurs, the cell transitions to `rejected`, reverts the input value to its previous valid state, and presents an error indicator with the rejection message.

---

## 4. Multi-Tenant Theme Engine (FR-5)

* **CSS Custom Properties & Runtime Sanitization:**
  * Theme switching operates via dynamic CSS custom properties applied directly to `:root`.
  * Theme configurations are validated and sanitized: hex codes default to fallback values if malformed, and radius values are clamped to safe boundary limits (0px–16px) to avoid layout breakage.