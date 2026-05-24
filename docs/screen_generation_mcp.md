# Screen Generation via MCP

DesignGate generates screens by calling a **design MCP server** directly — Claude
invokes the server's tools as part of the workflow (Steps 4–6 of `SKILL.md`). There is
no script to run and no API client to maintain in your project: the MCP server is the
generation layer.

DesignGate is **provider-agnostic**. Any MCP server that satisfies the contract below
works. **Google Stitch ships as the built-in default** — its setup is documented here in
full so you can be running in a few minutes.

---

## The generation-layer contract

The skill never hardcodes tool names. At runtime Claude sees whatever tools the configured
server exposes (as `mcp__<server>__<tool>`) and maps them to three capabilities:

| Capability | What it does | Used in |
|------------|--------------|---------|
| **GENERATE** | Turn the Step 3 text prompt into one or more screens/designs. | Step 4 |
| **PREVIEW** | Return a viewable reference for a generated screen (URL, image, or screen ID) so a human can review it. | Step 4 → Step 5 |
| **EXPORT** | Return the approved screen as HTML/CSS or component code for implementation. | Step 6 |

A server satisfies the contract if it offers at least one tool for each capability. That is
the only requirement. The async/iteration mechanics (does GENERATE block, or return a job
you poll?) are handled conversationally by Claude — it calls GENERATE, then uses PREVIEW to
check for the result before presenting it.

---

## Default provider: Google Stitch

Stitch (Google Labs, powered by Gemini) turns a text prompt into UI designs plus HTML/CSS.
A community MCP server wraps the Stitch API. The reference server used here is
[`oogleyskr/stitch-mcp-server`](https://github.com/oogleyskr/stitch-mcp-server).

### How Stitch's tools map to the contract

| Contract capability | Stitch MCP tools |
|---------------------|------------------|
| GENERATE | `generate_screen_from_text`, `generate_variants`, `edit_screens` |
| PREVIEW | `list_screens`, `get_screen`, `get_screen_image` |
| EXPORT | `get_screen_code` (HTML/CSS), `screen_to_react` (React/TSX), `build_site` |

> Other useful Stitch tools the skill may draw on: `extract_design_context` /
> `apply_design_context` (carry one screen's design system into the next — keeps a
> multi-screen project visually consistent), `screen_to_tailwind_config`,
> `screen_to_css_variables`, `generate_dark_mode`.

### Setup

1. **Build the server** (it is distributed as source, not an npm package):

   ```bash
   git clone https://github.com/oogleyskr/stitch-mcp-server.git
   cd stitch-mcp-server
   npm install
   npm run build      # compiles to dist/index.js
   ```

2. **Get a key.** The server authenticates with one of:
   - `STITCH_API_KEY` — a Google API key
   - `STITCH_ACCESS_TOKEN` — an OAuth2 access token
   - gcloud CLI auto-detection (fallback)

   Put the key in your shell environment or `.env` (do not commit it).

3. **Register the server with Claude Code.** Copy `templates/mcp/designgate.mcp.json` to
   `.mcp.json` at your project root and set the absolute path to the built server:

   ```json
   {
     "mcpServers": {
       "stitch": {
         "command": "node",
         "args": ["/absolute/path/to/stitch-mcp-server/dist/index.js"],
         "env": { "STITCH_API_KEY": "${STITCH_API_KEY}" }
       }
     }
   }
   ```

   Equivalent one-liner:

   ```bash
   claude mcp add stitch -- node /absolute/path/to/stitch-mcp-server/dist/index.js
   ```

4. **Confirm.** Start Claude Code and check that `mcp__stitch__*` tools are listed. The
   skill will discover and use them automatically.

---

## Bring your own provider

To use a different design service, register its MCP server in `.mcp.json` under any name
and ensure it offers tools covering GENERATE, PREVIEW, and EXPORT. No change to `SKILL.md`
is needed — Claude maps the configured server's tools to the contract at runtime. If your
server names them very differently from Stitch's, the mapping still works because the skill
selects by capability, not by literal tool name.

If more than one design MCP server is configured, tell Claude which one to use, or remove
the ones you don't want for the project.

---

## The iteration loop (how Step 4 behaves)

This is the human-UX-designer loop the skill is built around:

1. Claude calls a GENERATE tool with the Step 3 prompt (typically requesting 2 variants).
2. Claude retrieves the result via a PREVIEW tool and presents the reference(s) to you.
3. You react — "tighten the spacing", "the empty state is wrong", "variant B but with the
   primary CTA on the right".
4. Claude folds your feedback into a revised prompt and calls GENERATE again (using
   `edit_screens` / `generate_variants` where the server supports targeted edits).
5. Repeat until you approve a specific screen (Step 5 — the mandatory approval gate).
6. On approval, Claude calls an EXPORT tool and implements from that output only (Step 6).

Claude holds the screen references in the conversation; there is no manifest file to manage.

---

## Troubleshooting

- **`mcp__stitch__*` tools don't appear:** the server failed to start. Check the absolute
  path in `args`, that `npm run build` produced `dist/index.js`, and that `node` is on PATH.
- **Auth errors on GENERATE:** the key is missing or lacks Stitch access. Verify
  `STITCH_API_KEY` is exported in the environment Claude Code runs in.
- **GENERATE returns a job/ID but no image:** the server is async — Claude should poll a
  PREVIEW tool (`get_screen` / `get_screen_image`) until the screen is ready.
- **Designs drift between screens:** use `extract_design_context` on an approved screen and
  `apply_design_context` on the next so the design system carries forward.

---

## Legacy: the Node SDK bridge (deprecated)

Before the MCP integration, DesignGate shipped a standalone generation script at
`templates/stitch/generate.js` (using `@google/stitch-sdk`). It is **retained as a
deprecated offline fallback** for environments that can't run an MCP server. The MCP path
above is the supported route. See `docs/stitch_workflow.md` for the legacy SDK reference.
