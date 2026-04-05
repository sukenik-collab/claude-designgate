# Stitch Integration — Technical Reference

> Reference for using Google Stitch with DesignGate. Read before touching
> `scripts/stitch/generate.js` or running generation for the first time.

---

## Prerequisites

- `STITCH_API_KEY` in `.env` at the repo root
- Node 20 LTS
- Run once before first use: `cd scripts/stitch && npm install`

---

## The Workflow

### Step 1 — DesignGate audit (before generation)

DesignGate resolves all open interaction decisions before any screen is generated.
If you're running generation manually, make sure you've completed the audit first —
screens generated from a vague spec produce generic output.

### Step 2 — Generate

```bash
cd scripts/stitch
npm install                                            # first time only
node generate.js --list                                # see all defined screens
node generate.js --stage dashboard                     # generate all screens in a group
node generate.js --stage dashboard --screen main       # single screen
```

The script generates each screen plus 2 variants with `creativeRange: "EXPLORE"`.
Output is saved to `scripts/stitch/output/<stage>-manifest.json` with:
- Screen IDs
- Preview image URLs (open these in a browser to review)
- `chosenScreenId` field (null by default — set after review)

**Note on duplicate screens:** If a Stitch project already has screens from a
previous run, the before/after diff will find nothing new and fail. This is safe —
the existing screens are still in Stitch. Use the screen IDs from a prior manifest,
or tell Claude which screen ID to pull directly.

### Step 3 — Review in Stitch

Open the preview image URLs from the manifest. To refine a screen:
1. Go to [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. Find the project `designgate-<stage>`
3. Open and edit the screen

**Getting the screen ID from the Stitch web UI:**
The screen ID is the `node-id` query parameter in the preview URL:
`stitch.withgoogle.com/preview/<project-id>?node-id=<screen-id>`

You can paste the full URL into the chat — Claude extracts the screen ID
from `?node-id=` automatically.

### Step 4 — Approve and hand off

When satisfied, tell Claude:

> "Done in Stitch. Screen ID is `<screen-id>`."

Or paste the full Stitch preview URL. You do not need to edit the manifest JSON.

Claude runs `--pull` and fetches the HTML.

### Step 5 — Pull HTML

```bash
node generate.js --pull screenId1,screenId2
```

Writes `output/<screenId>.html.url.txt` (the download URL) and `output/<screenId>.html`
(the actual HTML). Claude reads the HTML from disk.

**Note:** HTML download URLs expire. If a URL returns 404, re-run `--pull` with the
same screen IDs to get a fresh URL.

### Step 6 — Convert to components

Claude reads the HTML and converts it to your project's component format
(React + Tailwind, Vue, or whatever the project uses). The HTML is the design
contract — Claude does not redesign during conversion.

---

## Adding Screens

Open `scripts/stitch/generate.js` and add entries to the `SCREENS` object:

```js
"your-screen-key": {
  label: "Human-readable label",
  prompt: `
${BRAND}

This screen is visible to [logged-in users only / logged-out users / all users].

[Layout, content, actions, edge states — see prompt writing rules below]
  `.trim(),
},
```

---

## Prompt Writing Rules

These rules come from real generated screens that missed the mark.

### Always specify authentication context first

Stitch defaults to full app chrome (sidebar, user avatar, nav items) if you
don't specify who sees the screen. This is wrong for error pages, landing pages,
and anything reachable without an account.

**First line after `${BRAND}` should always be:**

> This screen is visible to [logged-in users only / logged-out users / all users
> including unauthenticated].

For **logged-in only**: include the persistent nav.
For **logged-out / all users**: no sidebar, no user avatar, no feature-specific
navigation. Product wordmark only. CTAs should only make sense without an account.

### Be explicit about CTAs — what appears AND what doesn't

Name the specific buttons and links you want, and name what you do not want.

```
CTAs: one primary button "Save changes" (accent color). Secondary: "Cancel" (text link).
Do not include: delete, archive, or any destructive actions on this screen.
```

### Specify every edge state

Empty state, loading state, error state, zero-results state — all of them.
Unspecified edge states get Stitch's defaults, which are usually generic.

---

## SDK Technical Notes (v0.0.3)

### Package name and version

```
npm install @google/stitch-sdk   # installs 0.0.3
```

The package is at `^0.0.3`. If `npm install` fails with `ETARGET`, use
`@google/stitch-sdk@latest`.

### Client instantiation

```js
// Correct
import { Stitch, StitchToolClient } from "@google/stitch-sdk";
const client = new StitchToolClient({ apiKey });
const stitch = new Stitch(client);

// Wrong — do not pass config directly to Stitch
const stitch = new Stitch({ apiKey });
```

### `project.generate()` is broken in v0.0.3

`Project.generate()` parses the API response incorrectly — it expects
`raw.outputComponents[0].design.screens[0]` but the API returns
`raw.outputComponents[0].designSystem`. It always throws.

**Workaround (already in generate.js):** Call
`client.callTool("generate_screen_from_text", { projectId, prompt })` directly.
Screens are created as a server-side side effect, accessible via `list_screens`.
The script snapshots screen IDs before and after to discover new ones.

The same response-parsing bug affects `Screen.edit()` and `Screen.variants()`.
Both are worked around in generate.js using `client.callTool()` directly.

### `generate_screen_from_text` creates both desktop and mobile screens

A single call typically creates two screens. The script prefers `DESKTOP` when
picking the primary screen ID. Both appear in the Stitch web UI.

### `generate_variants` tool signature

```js
await client.callTool("generate_variants", {
  projectId: "...",
  selectedScreenIds: ["screen-id"],
  prompt: "Describe the variation...",
  variantOptions: { variantCount: 2, creativeRange: "EXPLORE" },
  deviceType: "DESKTOP",
});
```

### Stitch projects persist by ID

The project `designgate-<stage>` is reused across sessions. Running generation
again adds new screens; it does not delete old ones. `scripts/stitch/output/`
should be gitignored — manifests and HTML are local only.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `STITCH_API_KEY not found` | Add key to `.env` in repo root, not in `scripts/stitch/.env` |
| `npm install` fails with `ETARGET` | Use `@google/stitch-sdk@latest` — package is at 0.0.3 |
| "No new desktop screen found" | Project already has screens from a prior run. Use existing screen IDs from the Stitch UI or a prior manifest. |
| Screen generation throws on `outputComponents` | SDK v0.0.3 bug — generate.js works around this. Verify the raw `callTool()` path is being used, not `project.generate()`. |
| HTML URL 404s | HTML URLs expire. Re-run `--pull` with the same screen IDs. |
| Variant count mismatch | `variantCount` max is 5. The API may return fewer if it can't differentiate. |
