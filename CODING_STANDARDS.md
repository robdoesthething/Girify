# Girify Coding Standards

## CSS
- Use Tailwind utilities only
- Z-index values: 10, 20, 30, 40, 50 (increments of 10)
- Spacing: gap-2, gap-4, gap-6 (no gap-3 or gap-5)

## Components
- Max 5 props per component
- Use compound components for complex UIs
- All modals must have backdrop and close button

## State
- Use useReducer for >3 related state values
- Keep state as local as possible
- No prop drilling >2 levels
