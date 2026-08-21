# HCP Data Explorer — Virtualized Healthcare Analytics Grid

A high-performance, virtualized data explorer designed to process, aggregate, and edit **50,000+ Healthcare Professional (HCP) records** with sub-millisecond responsiveness. Built with **React 19, Vite, TypeScript, and `@tanstack/react-virtual`**.

---

## Key Features & Functional Compliance

### 1. High-Scale Virtualization & Dynamic Tree Rendering (FR-1, FR-2, FR-6)
* **Virtual Viewport:** Renders only visible rows in the DOM using `@tanstack/react-virtual`, maintaining a smooth 60 FPS scroll rate across 50,000+ records.
* **1D Flattened Tree Projection:** Flattens multi-level grouped data (`Region` → `Territory` → `HCP Record`) into an indexed linear array, avoiding nested DOM structures that break virtualization sizing.
* **Sticky Multi-Level Headers:** Hierarchical group headers remain sticky during vertical scrolling with dedicated visual depth and dynamic row heights (40px group headers vs 36px leaf rows).

### 2. Multi-Level Aggregation & Zero-Division Safety (FR-2, FR-7)
* **Defensive Coercion:** Sanitizes dirty mock generator inputs (e.g., stringified numbers like `"35"`) to prevent `NaN` cascading.
* **Live KPI Rollups:** Computes real-time group sums for `Calls`, `TRx`, `NRx`, and `Cost Per Interaction (CPI)`.
* **Zero-Division Handling:** Evaluates $\text{CPI} = \frac{\text{Calls}}{\text{TRx}} \times 100$ defensively, rendering `"—"` whenever $\text{TRx} = 0$ instead of crashing with `Infinity` or `NaN`.

### 3. Isolated Edit Lifecycle & Rollback Recovery (FR-3, FR-4)
* **4-State Machine:** Every editable cell tracks an explicit state machine: `idle` → `pending` → `saved` / `rejected`.
* **Subtotal Isolation:** Live territory/region subtotals strictly exclude `pending` edits. Edits roll up only after successful server validation (`saved`).
* **Transient 503 & Cap Error Handling:** Automatically handles mock network drops (503s) and business rule violations (Calls > 60 or negative numbers) by rolling back the cell value to its previous valid state and highlighting an error tooltip.

### 4. Non-Snapshot Delta Undo/Redo Engine (FR-4)
* **Command Pattern History:** Manages history by storing lightweight cell mutation deltas (`{ cellKey, prevValue, nextValue }`) rather than cloning the entire 50,000-row dataset.
* **Stack Pruning:** Truncates the redo stack on new user edits and cleanly handles keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`).

### 5. Search, Filter & Branch Auto-Expansion (FR-3)
* **Global Search & Filter:** Filters across all data fields with automatic branch expansion, ensuring matched HCPs inside collapsed regions/territories are immediately visible.
* **Region Filtering:** Real-time single-region scoping with dynamic recalculation of aggregate metrics.

### 6. Dynamic Multi-Tenant Theme Engine (FR-5)
* **Runtime CSS Custom Properties:** Injects tenant themes instantly onto `:root` CSS variables without re-mounting or stylesheet flickering.
* **Configuration Sanitization:** Defensive parsing validates hex codes and clamps boundary values (e.g., radius capped to 0–16px).

---

## Tech Stack

* **Core Framework:** React 19, TypeScript, Vite
* **Virtualization Engine:** `@tanstack/react-virtual`
* **Styling:** Pure CSS Custom Properties (Zero runtime CSS-in-JS overhead)
* **Testing:** Vitest, React Testing Library, JSDOM

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Starts the local development server at http://localhost:5173.

### 2. Run Automated Tests
```bash
npm run test:run
```
Runs the full Vitest suite covering aggregation logic, state lifecycles, and theme sanitization.

### 3. Build for Production
```bash
npm run build
```


## Project Structure

```text
src/
├── components/          # Presentation and UI views
│   └── HcpGrid.tsx      # Virtualized grid table, toolbar, and rows
├── hooks/               # Concurrency & state management
│   ├── useTableStore.ts # Command stack undo/redo & async validation
│   └── useTableStore.test.ts
├── utils/               # Pure computational utilities (Zero React deps)
│   ├── aggregation.ts   # Tree grouping, filtering, sorting, CPI math
│   ├── aggregation.test.ts
│   ├── theme.ts         # Multi-tenant CSS property injector
│   └── theme.test.ts
├── starter/             # Mock data generator & async validator
├── test/                # Test polyfills & runner setup
│   └── setup.ts
├── types/               # TypeScript type contracts
│   └── index.ts
├── App.css              # Custom styling and sticky layout tokens
├── App.tsx              # Application composition root
└── main.tsx             # Bootstrap entry point
```