# DesignGate

A human-in-the-loop checkpoint system that ensures AI receives complete,
constrained, and approved intent before building your UI.

Most AI-assisted development workflows skip the design step. The AI receives a spec,
makes every interaction and visual decision silently, and produces a working screen
that looks like default output — not your product. DesignGate adds a mandatory
checkpoint: no UI gets built until a human has seen it, reacted to it, and approved it.

## What it does

1. When Claude encounters a UI-heavy task, DesignGate activates automatically
   (requires CLAUDE.md snippet — see Installation)
2. It checks whether a brand brief exists and is sufficient
3. It reads the spec section, checks prior UX decisions, and surfaces only the
   interaction questions that are genuinely unresolved — batched, capped at five
4. It writes the resolved decisions to `docs/ux_decisions.md` for future screens
5. It generates a complete, constrained prompt for your visual generation tool
6. It stops. You review the generated screens and approve one.
7. Implementation proceeds from the approved screen only. The design is locked.

## The principle

The spec tells the AI what a screen does. It doesn't tell it what the screen should
feel like — whether a destructive action needs a confirm dialog, whether a secondary
action lives in a panel or a full page, what an empty state says to a new user.
DesignGate surfaces those decisions before generation and puts them in front of you.

The loop belongs to the AI. The judgement belongs to you.

## Installation

### 1. Copy the skill file

```
mkdir -p .claude/skills/designgate
cp SKILL.md .claude/skills/designgate/SKILL.md
```

### 2. Add the CLAUDE.md snippet (required for automatic triggering)

Copy the contents of `templates/claude_md_snippet.md` into your project's `CLAUDE.md`.
This is what causes Claude to apply the DesignGate workflow automatically. Without this
step, DesignGate will not activate on its own — you must invoke `/designgate` manually.

### 3. Initialize the UX decisions log (optional)

```
cp templates/ux_decisions_template.md docs/ux_decisions.md
```

This file grows over time as Claude resolves interaction decisions. After 2–3 screens,
the audit shortens significantly — prior decisions are applied silently.

### 4. Create your brand brief

The brand brief is required before DesignGate can generate screens. You have two options:

- **Let DesignGate build it interactively** — if no brief exists, it will ask you a
  series of questions and save the result to `docs/brand_brief.md` automatically.
- **Write it yourself** — use `templates/brand_brief_sample.md` as a reference for
  what a complete brief looks like.

## How automatic triggering works

DesignGate is designed to activate automatically when the CLAUDE.md snippet is
installed. Claude reads it at session start and applies the workflow when it encounters
UI work. Without the snippet, automatic triggering does not occur — use `/designgate`
explicitly. The snippet is the enforcement mechanism, not the skill file alone.

Common trigger phrases (also recognized when invoking the skill directly):
- "build the [screen/page/flow]"
- "create the [UI/interface/frontend]"
- "add [screens/UI/the frontend for]"
- "implement [the design/the UI/the screens]"

## Decision memory across sessions

DesignGate maintains `docs/ux_decisions.md` — a log of every interaction decision
resolved during an audit. Before asking questions for any screen, Claude reads this
file and:

- Applies already-decided items silently (no question asked)
- Surfaces adjacent decisions with prior context: "In [screen] you chose X — does
  the same apply here?"

This means the audit shortens as the project matures. A well-specified project with
3–4 screens already built may see 0–2 questions per new screen.

## Capability Reconciliation Mode (brownfield redesigns)

When rebuilding an existing screen rather than designing a new one, use the screen
context bundle to declare what the current screen does before the interaction audit begins.

### The two-source model

```
Intent source:        spec    — what we want the system to be
Reality declaration:  bundle  — what the caller says currently exists
Code:                         — optional diagnostic lens only
```

The spec defines the desired system. The bundle is the caller's complete declaration of
what currently exists. Code files can be provided as context to clarify what a declared
capability does — they cannot introduce capabilities not declared in the bundle.

DesignGate does not verify API correctness, runtime reachability, or deprecation status.
Those judgments belong to the caller, declared explicitly in the bundle.

### Three tiers of capability

| Tier | Examples | Rule |
|------|----------|------|
| User Capabilities | upload_cv, delete_proof | MUST appear in new design |
| System Behaviors | loading states, retry logic | Context only — may change entirely |
| Data Entities | CV, Proof (schema) | Schema must preserve; interaction logic need not |

Only User Capabilities are hard requirements. System Behaviors are context notes.
Data Entities define the data model constraint, not the interaction shape.

### What changes in the workflow

- **Step 1.5 (Capability Reconciliation)** activates when a bundle is provided. It reads
  the spec first, then the bundle, compares them, and produces a three-tier Capability Map.
  Any User Capability declared in the bundle but absent from the spec is surfaced for
  confirmation before the audit begins.
- **Step 2 (interaction audit)** asks HOW, never WHETHER. Capability existence is
  confirmed in Step 1.5 — the audit is about how each is expressed, not whether it exists.
- **Step 3 (prompt generation)** includes a REQUIRED CAPABILITIES section — a flat verb
  list that serves as a completeness checklist for the screen generation layer.

### What does not change

The greenfield workflow is unchanged. Step 1.5 is conditional — it only activates when a
bundle is provided. The mandatory human approval gate (Step 5) applies in all cases.

### Core principle

> DesignGate uses the spec as the design authority and the caller-provided bundle as the
> complete capability declaration. Code is an optional diagnostic lens — it can clarify
> what a declared capability does, but it cannot introduce capabilities not declared in
> the bundle. DesignGate does not verify backend implementation. Its job is to ask:
> "does your spec cover everything you declared must exist?"

### Setup

```
cp templates/screen_context_bundle.md [fill out for your screen]
```

Provide the filled bundle alongside your redesign request. The Capability Map format
is defined inline in Step 1.5 of `SKILL.md` — `templates/capability_map_schema.md`
is supplementary context only and is not required to be present.

---

## Screen generation (external tooling)

DesignGate is tool-agnostic. The skill outputs a complete, structured prompt — your
screen generation layer produces the screens.

**Default implementation: Google Stitch**

A working Stitch integration is included in `templates/stitch/`:

- `generate.js` — the generation script (list, generate, pull modes)
- `package.json` — dependencies (`@google/stitch-sdk@0.0.3`, `dotenv`)

To install it in your project:

```
mkdir -p scripts/stitch
cp templates/stitch/generate.js scripts/stitch/generate.js
cp templates/stitch/package.json scripts/stitch/package.json
cd scripts/stitch && npm install
```

Add `STITCH_API_KEY=your-key` to your `.env`, then open `scripts/stitch/generate.js`
and replace the `BRAND` constant and `SCREENS` object with your project's content.
See `docs/stitch_workflow.md` for the full SDK reference and troubleshooting guide.

**Bring your own tool:** anything that takes a structured text prompt and returns
reviewable screens works. The DesignGate skill generates the prompt — your tool
produces the output.

## The design contract

Once a screen is approved, implementation follows it exactly. Claude does not redesign
during implementation.

Exception: if a redesign is genuinely required (layout conflict, responsive issue,
accessibility problem, changed requirements), Claude stops, explains the constraint,
generates a revised prompt, and waits for re-approval. Minor styling variations that
don't affect layout or interaction patterns don't require re-approval.

## What DesignGate is not

- Not a UI generation tool (it orchestrates your tool)
- Not a design system (it enforces yours)
- Not a mockup reviewer (you are)
