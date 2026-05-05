# Data-Bridge Frontend Design System

## Visual Direction

Data-Bridge should feel like a real internal SaaS tool: dense, calm, technical and operational. The UI prioritizes scanning, comparison and repeat usage.

## Palette

```text
Background absolute: #050816
Background secondary: #0B1020
Surface primary:     #111827
Surface secondary:   #0F172A
Border:              #1E293B
Text primary:        #F8FAFC
Text secondary:      #94A3B8
Primary blue:        #2563EB
Operational cyan:    #06B6D4
Intelligence violet: #8B5CF6
Success green:       #22C55E
Warning yellow:      #FACC15
Critical red:        #EF4444
```

## Layout

- Fixed left sidebar.
- Horizontal topbar.
- Dense dashboard grid.
- Predictable cards.
- Tables optimized for scanning.
- Charts with stable height.

## Components

- AppShell
- Sidebar
- Topbar
- LoginForm
- RegisterForm
- MetricCard
- ChartPanel
- StatusBadge
- DatasetTable
- DatasetForm
- ImportDropzone
- ImportJobsTable
- AlertList
- ReportList
- AuditTable
- EmptyState
- LoadingState
- ErrorState

## Interaction Principles

- Buttons use icons when the action is familiar.
- Filters are grouped near the data they affect.
- Loading, error and empty states are explicit.
- Text stays compact inside operational panels.

## Auth Experience

Authentication screens use the same dark operational system as the app. Login and registration must show loading, validation and API error states, then redirect into the protected workspace.
