# Brand Brief — Fieldnotes (Sample)

> This is a filled-in example to show what a complete brand brief looks like.
> Copy `brand_brief_sample.md` to `docs/brand_brief.md` and replace the content
> with your own product's details, or let DesignGate run the Brand Brief Formation
> workflow to build it interactively.

---

## Product identity

**Product name:** Fieldnotes

**Tagline:** Your research, organised.

**What it is:** A research management tool for qualitative researchers — UX researchers,
journalists, and academics — to capture, tag, and synthesise interview notes, observations,
and source material.

**Who it's for:** Individual researchers and small teams (2–5 people) doing fieldwork.
Not enterprise. Not students doing one-off projects.

**What it is not:**
- Not a note-taking app (Notion, Obsidian). Fieldnotes is structured around research
  artefacts: participants, sessions, quotes, themes. Generic notes are not the model.
- Not a survey tool. No data collection from participants — only researcher-side synthesis.
- Not a collaboration-first product. Sharing exists but the core loop is a solo researcher
  working through raw material.

---

## Color palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#F5F2EC` | Warm off-white. Every page background. |
| Surface | `#FFFFFF` | Cards, panels, modals. |
| Primary text | `#1C1C1E` | Headings, body, labels. |
| Secondary text | `#6B7280` | Metadata, captions, helper text. |
| Accent | `#2563EB` | Primary actions, links, active states. |
| Accent muted | `#DBEAFE` | Tag backgrounds, highlight fills. |
| Destructive | `#DC2626` | Delete, archive, irreversible actions. |
| Border | `#E5E7EB` | Subtle separators, card edges. |

---

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| UI / body | Inter | 400, 500 | All labels, body text, inputs. |
| Page headings | Lora | 600 | Section titles only. Serif warmth without being decorative. |
| Quotes / excerpts | Inter | 400, italic | Research quotes shown inline in the synthesis view. |
| Monospace | JetBrains Mono | 400 | Codes, IDs, export previews only. |

---

## Tone and voice

**Three adjectives:** Focused, warm, precise.

**What it should never feel like:** Clinical, corporate, overwhelming.

**Voice principles:**
- Speak to the researcher as a peer. Assume they know what they're doing.
- Labels are nouns, not instructions. "Sessions" not "Manage your sessions."
- Empty states are honest, not cute. "No participants added yet." Not "Your participants
  will appear here once you add them! 🎉"
- Error messages say what happened and what to do. No passive voice.

---

## Vocabulary

**Preferred terms:**
- Participant (not "user," "respondent," or "subject")
- Session (not "interview," "call," or "meeting")
- Quote (not "excerpt," "clip," or "highlight")
- Theme (not "tag," "category," or "label" — themes are synthesised, not assigned)
- Brief (not "project," "study," or "workspace")

**Avoided terms:**
- "Insight" as a noun for a database object (overused in the space, means nothing)
- "Smart" anything
- "AI-powered" (the AI is a tool, not a feature to advertise)
- "Collaborate" (sharing exists but the product is not collaboration-first)

---

## Component patterns

- **Navigation:** Persistent left sidebar on desktop (240px). Collapsible to icons on
  smaller viewports. Brief switcher at the top.
- **Buttons:** Primary = accent blue fill, white text. Secondary = white fill, 1px border.
  Destructive = red fill, white text. No ghost buttons for primary actions.
- **Cards:** White background, 1px `#E5E7EB` border, 12px border-radius, 16px padding.
  Subtle shadow on hover only.
- **Tags/pills:** Accent muted background (`#DBEAFE`), accent text (`#2563EB`), 4px
  border-radius. Small (12px font). Used for themes only — not for status.
- **Status indicators:** Text + color only. No icons for status. "In progress," "Complete,"
  "Draft" — each in a distinct muted color.
- **Modals:** Centered, max-width 560px, backdrop blur. Destructive actions require a
  second confirmation click — no separate confirmation modal.

---

## What the product is not (design implications)

| Not this | Design implication |
|----------|-------------------|
| Not a collaboration tool | No "sharing" affordances in primary nav. Share lives in settings. |
| Not a note-taking app | No free-form canvas. Every screen is structured around research objects. |
| Not enterprise | No role management, no permissions UI in the main app. Admin is a single settings page. |
| Not mobile-first | Desktop is the reference frame (1280px). Mobile is supported but not optimised for. |
