# DesignGate — CLAUDE.md Snippet

Copy this section into your project's `CLAUDE.md` to enforce the DesignGate workflow
automatically. Claude reads this at session start and applies it for any UI-heavy task
without requiring explicit invocation.

---

## UI Design Workflow — Mandatory for UI-Heavy Stages

Before building any feature with significant frontend UI:

1. Check that a brand brief exists at `docs/brand_brief.md`. If it doesn't, run the
   Brand Brief Formation workflow before proceeding.
2. Read `docs/ux_decisions.md` if it exists. Apply already-decided items silently.
   For adjacent decisions, surface the prior choice when asking.
3. Read the relevant spec section and surface every interaction question the spec
   doesn't answer and the brand brief doesn't resolve. Present these as a batched
   list (maximum 5 questions). Wait for answers.
4. Write resolved decisions to `docs/ux_decisions.md`.
5. Use the answers + brand brief to generate a complete visual generation prompt.
6. Generate screens by calling the configured design MCP server's tools (Google Stitch by
   default — see `docs/screen_generation_mcp.md`). Iterate on the user's feedback, then stop
   and wait for explicit approval before building anything.
7. Build from the approved screen only — export it from the design server and implement that
   output. The approved design is the contract.

**Do not build UI directly from the spec.** This workflow is mandatory for any screen
where the spec leaves interaction decisions open (layout, panel vs page, empty states,
modal vs inline, mobile vs desktop CTA differences).

Skip only when every interaction on the screen maps to an already-decided pattern
in `docs/ux_decisions.md` or the brand brief, or when the task has no frontend
component at all.

**Brownfield redesigns (rebuilding an existing screen):** Fill out
`templates/screen_context_bundle.md` and provide it before Step 3. Declare what user
capabilities the current screen supports — DesignGate treats your declaration as
authoritative and reconciles it against the spec (Step 1.5). Code files are an optional
diagnostic lens only; they cannot introduce capabilities not declared in the bundle.
UX patterns and interaction logic from existing code are never carried forward.
