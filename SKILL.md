---
name: designgate
description: >
  Human-in-the-loop UI design checkpoint. Activates automatically when the CLAUDE.md
  snippet is installed; use /designgate explicitly otherwise. Checks that a brand brief
  exists, reads prior UX decisions to avoid re-asking resolved questions, surfaces only
  genuinely unresolved interaction decisions (batched, max 5), generates a complete
  screen generation prompt for visual generation, and enforces a mandatory human approval
  gate before any implementation begins. The approved screen is the design contract.
---

# DesignGate — Instructions

## Purpose

Ensure that AI-generated UI reflects human decisions on brand, interaction design,
and visual direction — not AI defaults. Enforce a mandatory human approval gate
before any UI implementation begins.

---

## Activation

### Automatic (requires setup)

DesignGate is designed to activate automatically when the CLAUDE.md snippet is
installed (see README and `templates/claude_md_snippet.md`). Claude reads it at
session start and applies the workflow for any UI-heavy task. Without the snippet,
DesignGate will not activate automatically — use `/designgate` explicitly.

### Explicit invocation

`/designgate` — triggers the workflow manually for the current task.

### Contextual triggers (skill-based)

Activate when the user's message contains any of:
- "build the [screen / page / flow / frontend / UI]"
- "create the [screen / interface / component / UI]"
- "add [screens / UI / frontend / the design for]"
- "implement [the design / the UI / the screens for]"

Do NOT activate for:
- Backend-only tasks with no frontend component
- Minor iterations explicitly described as variations of an already-approved design
- Tasks where every interaction on the screen maps to an already-decided pattern
  in `docs/ux_decisions.md` or the brand brief

---

## Step 1 — Brand brief check

Check for a brand brief at `docs/brand_brief.md` (or the path configured in CLAUDE.md).

**If missing or clearly insufficient** (no color palette, no typography, no tone):

> "Before I can generate screens for this, we need a brand brief. A brand brief takes
> about 15 minutes and prevents every screen from looking like default output.
>
> I'll ask you a series of questions to build it. We'll cover: product identity, color
> palette, typography, tone, and what the product explicitly isn't. Ready?"

Run Brand Brief Formation (see below). On completion, save to `docs/brand_brief.md`
and continue.

**If sufficient**: proceed to Step 2.

What counts as sufficient is a matter of judgment. A brand brief that specifies a
color palette, at least one typographic direction, and a clear tone is sufficient
to proceed.

---

## Step 2 — Interaction audit

Read the spec section (or task description) for the screen(s) being built.

**Before composing any questions**, read `docs/ux_decisions.md` if it exists.

For each potential question:
- If already decided in `docs/ux_decisions.md`: apply the prior decision silently.
  Do not ask.
- If adjacent to a prior decision but not identical: include the prior context in
  the question — "In [screen] you decided X. Does the same apply here, or is this
  case different?"
- If covered by the brand brief: apply it silently. Do not ask.
- If genuinely unresolved: include in the audit.

Identify every interaction decision that is not specified in the spec AND not answered
by the brand brief AND not already in `docs/ux_decisions.md`.

**Batch all questions in a single message. Never ask one question at a time.**

**Maximum 5 questions per screen.** If you identify more than 5 genuinely unresolved
decisions, surface the most consequential ones and note: "The spec section for this
screen may need more detail before we proceed."

Example questions:
- Is [action] immediate or does it require confirmation?
- Does [secondary feature] open in a slide-over or a full page?
- What does the empty state show for a user with no [objects] yet?
- Which CTAs appear on mobile vs desktop?
- Is [feature] visible to all users or gated by [condition]?

Wait for answers. Do not proceed until all questions are answered.

---

## Step 2b — Record decisions

After the user answers the audit questions, write each resolved decision to
`docs/ux_decisions.md`.

Format:

```markdown
| Decision | Resolution | First decided | Screen |
|----------|-----------|---------------|--------|
| [decision type, not screen-specific] | [what was decided] | [date] | [screen name] |
```

Key the decision by type, not by screen — this is what enables future screens to
match against it.

If any answer reveals a product-wide principle (e.g., "we never use confirmation
dialogs — always prefer undo"), flag it:

> "This sounds like a product-wide principle. Should I add it to the brand brief
> so it applies everywhere automatically?"

If yes, add it to `docs/brand_brief.md` as well.

---

## Step 3 — Generate screen generation prompt

Using: answers from Step 2 + brand brief + relevant spec section + auth context
(who sees this screen, what state they are in).

Generate a complete prompt with the following structure:

```
BRAND
[Full brand block — colors, typography, tone, vocabulary. Do not summarize.]

SCREEN: [name]
AUTH CONTEXT: [who sees this, what state they are in]

LAYOUT
[Describe the layout structure, responsive behavior, key zones]

CONTENT
[Specify every piece of content: headings, labels, placeholder text, empty states,
 error states. Be explicit.]

ACTIONS
[List every CTA. For each: label, placement, behavior, visibility conditions.
 Include what does NOT appear.]

EDGE STATES
[Empty state, loading state, error state, zero-results state — all of them.
 Do not leave any unspecified.]

COMPONENT HIERARCHY
[Describe the nesting and relationship of UI components. Do not leave this implicit.]

VARIANTS
Request 2 variants.
```

This prompt must be complete enough to pass directly to the screen generation layer without
modification. Do not write a summary prompt and expect the screen generation layer to fill gaps.

---

## Step 4 — Generate screens

Pass the prompt to the screen generation layer (Stitch, or the tool configured for the project).

If using `scripts/stitch/generate.js`:
```
node scripts/stitch/generate.js --prompt "[screen generation prompt]"
```

---

## Step 5 — Human approval gate (mandatory stop)

**STOP.** Do not proceed to implementation.

Present:
> "Screens are ready for review. Open [tool URL/reference] and review the generated
> screens. When you've approved one, give me the screen ID (or reference) and I'll
> proceed with implementation."

Wait for explicit approval. A screen ID, URL reference, or clear "approved" is
required. Do not interpret silence or vague responses as approval.

---

## Step 6 — Lock design and implement

Confirm approval:
> "Design locked: [screen reference]. Implementing from this screen only."

Build from the approved screen. Pull the HTML/CSS if using Stitch. Convert to the
project's component format (React + Tailwind, or as configured).

The approved screen is the design contract. Do not redesign during implementation.

---

## Redesign exception

If implementation reveals a genuine constraint (layout conflict, responsive failure,
accessibility issue, changed requirements):

1. Stop. Do not work around it silently.
2. Explain the specific constraint to the user.
3. Generate a revised screen generation prompt that addresses it.
4. Return to Step 4. Wait for re-approval before continuing.

Minor styling variations (color shade, spacing, font weight) that don't affect layout
or interaction patterns do not require re-approval.

---

## Brand Brief Formation (sub-workflow)

When a brand brief is missing or insufficient, run this before Step 2.

Ask in a single message:

> "To build your brand brief, I need answers to a few questions:
>
> 1. **Product identity**: What is this product? Who is it for? What is it explicitly not?
> 2. **Color palette**: Do you have specific hex values, or should I suggest a palette
>    based on the product identity?
> 3. **Typography**: Any font preferences? (If none, I'll suggest options.)
> 4. **Tone**: Describe the feel in 3 adjectives. What should it never feel like?
> 5. **Vocabulary**: Any specific terms that must be used or avoided in the UI?
>
> Answer what you know. I'll fill reasonable defaults for anything you leave open."

On receipt of answers, write `docs/brand_brief.md` with:
- Product name and tagline
- Color palette (hex values)
- Typography
- Tone and voice principles
- Vocabulary (preferred and avoided)
- What the product is not

Confirm: "Brand brief saved to `docs/brand_brief.md`. You can edit it at any time.
Changes to the brief will affect all future screens."

---

## Notes on question fatigue

The interaction audit is only valuable if it surfaces decisions that actually matter.
Correct behavior after a project has 2–3 screens:

- 0–2 questions: spec is thorough, decisions log is populated
- 3–5 questions: some new interaction territory
- More than 5: the spec section needs more detail — surface that, don't ask all of them

The brand brief eliminates a large class of questions permanently. The decisions log
eliminates recurring questions across screens. Both should shrink the audit over time.
That's the goal — not asking fewer questions by skipping them, but asking fewer
questions because the project has answered them already.
