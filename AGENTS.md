# Implementation rules
- Keep wind-channel approximations in pure simulation helpers, precomputing obstacle projections outside particle loops; this preserves testability and frame budgets.
- Imported model analysis applies estimated rotor parameters, not the source mesh; keep that distinction explicit to avoid implying mesh-resolved aerodynamics.
- Collapse Blade Lab sidebars using the resizable-panel API with zero collapsed size and viewer-side restore controls; this preserves the user's expanded dimensions.