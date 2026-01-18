# Virtualized DataGrid

A high-performance, accessible data grid built from scratch in React 18 with TypeScript.

## Features

- ✅ **Manual Virtualization** - No react-window or tanstack/virtual
- ✅ **50,000+ Rows at 60fps** - O(1) visible range calculation
- ✅ **Full Keyboard Navigation** - Roving tabindex pattern
- ✅ **ARIA Accessibility** - Screen reader support
- ✅ **Sorting** - Click headers to sort
- ✅ **Inline Editing** - Double-click cells to edit
- ✅ **Row Selection** - Single and multi-select
- ✅ **Column Resizing** - Drag column borders
- ✅ **TypeScript Strict Mode** - Full type safety
- ✅ **Tailwind CSS** - Design token based styling

## Tech Stack

- React 18
- TypeScript (strict mode)
- Vite
- Tailwind CSS
- Storybook
- Vitest + Testing Library

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Storybook
npm run storybook

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   └── DataGrid/           # Core grid component
│       ├── DataGrid.tsx    # Main composition root
│       ├── Header/         # Header components
│       ├── Body/           # Row and cell components
│       ├── Editors/        # Inline edit components
│       └── Internal/       # Internal utilities
├── hooks/
│   ├── useVirtualizer.ts   # Virtualization engine
│   ├── useGridState.ts     # State management
│   ├── useKeyboardNav.ts   # Keyboard navigation
│   └── useSelection.ts     # Selection handling
├── types/                  # TypeScript definitions
├── utils/                  # Utility functions
├── constants/              # Design tokens
└── styles/                 # CSS/Tailwind
```

## Performance

The grid achieves 60fps scrolling through:

1. **O(1) Virtualization Math** - Only renders visible rows (~20-30)
2. **React.memo with Custom Comparison** - Prevents unnecessary re-renders
3. **RAF-based Scroll Updates** - Synchronized with browser paint
4. **CSS Containment** - Isolates layout calculations
5. **Stable Callbacks** - useCallback for event handlers

## Accessibility

- `role="grid"` with `aria-rowcount` and `aria-colcount`
- `role="row"` with `aria-rowindex`
- `role="gridcell"` with proper labeling
- `aria-sort` on sortable columns
- Keyboard navigation (Arrow, Tab, Enter, Escape)
- Screen reader announcements for state changes

## License

MIT
