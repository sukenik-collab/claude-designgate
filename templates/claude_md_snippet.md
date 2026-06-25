# DesignGate — CLAUDE.md Snippet (optional)

**You do not need this snippet for DesignGate to work.** The skill auto-activates from its
`description` as soon as it's installed in `.claude/skills/designgate/`. Add this snippet
only if you want a hard, always-on backstop pinned in context — a guarantee the mandatory
gate is honored even if auto-invoke ever misses. The full workflow lives in the skill, so
this is intentionally short.

---

## UI Design Workflow — Mandatory for UI-Heavy Stages

Before building any feature with significant frontend UI, the **DesignGate** skill is
mandatory. **Do not build UI directly from the spec.** DesignGate auto-activates on UI-heavy
work; if it doesn't, invoke `/designgate`. It enforces: brand-brief check → batched
interaction questions (max 5) → screen generation via the configured design MCP → a human
approval gate before any implementation. The approved screen is the contract.

Skip only when every interaction maps to an already-decided pattern in `docs/ux_decisions.md`
or the brand brief, or when the task has no frontend component. For brownfield redesigns,
provide a filled `templates/screen_context_bundle.md` first.

See `.claude/skills/designgate/SKILL.md` for the full workflow.
