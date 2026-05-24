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

Stitch (Google, powered by Gemini) turns a text prompt into UI designs plus HTML/CSS. It
ships an **official MCP server** — a remote HTTP endpoint at `https://stitch.googleapis.com/mcp`
(authenticated with the `X-Goog-Api-Key` header) — plus an official proxy CLI,
[`@_davideast/stitch-mcp`](https://github.com/davideast/stitch-mcp), that runs it locally
over stdio and handles auth for you. Official setup docs:
<https://stitch.withgoogle.com/docs/mcp/setup/>.

The proxy is the recommended path for Claude Code.

### How Stitch's tools map to the contract

| Contract capability | Stitch MCP tools |
|---------------------|------------------|
| GENERATE | the server's screen-generation tool(s) — e.g. `generate_screen_from_text` |
| PREVIEW | `get_screen_image` (screenshot as base64), plus the server's list/get-screen tools |
| EXPORT | `get_screen_code` (screen HTML), `build_site` (full site from screens → routes) |

`build_site`, `get_screen_code`, and `get_screen_image` are the documented higher-level
tools. The proxy also surfaces the upstream Stitch API operations (generation, listing),
which Claude discovers at runtime — so the exact generation tool name doesn't need to be
known in advance.

### Setup

1. **Register the server with Claude Code.** Copy `templates/mcp/designgate.mcp.json` to
   `.mcp.json` at your project root:

   ```json
   {
     "mcpServers": {
       "stitch": {
         "command": "npx",
         "args": ["@_davideast/stitch-mcp", "proxy"]
       }
     }
   }
   ```

2. **Authenticate** with one of:
   - **API key (simplest):** `export STITCH_API_KEY="your-key"` in the environment Claude
     Code runs in.
   - **OAuth (guided):** `npx @_davideast/stitch-mcp init` — runs a wizard that handles
     gcloud, OAuth, credentials, and project setup.
   - **System gcloud:** `gcloud auth application-default login` then
     `gcloud config set project <PROJECT_ID>`, and add `"env": { "STITCH_USE_SYSTEM_GCLOUD": "1" }`
     to the config block above.

3. **Confirm.** Start Claude Code and check that `mcp__stitch__*` tools are listed. The
   skill discovers and uses them automatically.

> **Remote (no local proxy):** if your client supports remote MCP servers, point it at
> `https://stitch.googleapis.com/mcp` with header `X-Goog-Api-Key: <your-key>` instead of
> running the proxy CLI.

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
4. Claude folds your feedback into a revised prompt and calls GENERATE again (using the
   server's edit/variant tool where it supports targeted edits).
5. Repeat until you approve a specific screen (Step 5 — the mandatory approval gate).
6. On approval, Claude calls an EXPORT tool and implements from that output only (Step 6).

Claude holds the screen references in the conversation; there is no manifest file to manage.

---

## Troubleshooting

- **`mcp__stitch__*` tools don't appear:** the proxy failed to start. Check that `npx` can
  reach `@_davideast/stitch-mcp` (network/registry access), and that authentication succeeded
  (`STITCH_API_KEY` set, or `init` completed).
- **Auth errors on GENERATE:** the key is missing or lacks Stitch access. Verify
  `STITCH_API_KEY` is exported in the environment Claude Code runs in.
- **GENERATE returns a job/ID but no image:** the server is async — Claude should poll a
  PREVIEW tool (`get_screen_image`) until the screen is ready.
- **Designs drift between screens:** use Stitch's design-context extract/apply tools — pull
  context from an approved screen and apply it to the next so the design system carries forward.

---

## Legacy: the Node SDK bridge (deprecated)

Before the MCP integration, DesignGate shipped a standalone generation script at
`templates/stitch/generate.js` (using `@google/stitch-sdk`). It is **retained as a
deprecated offline fallback** for environments that can't run an MCP server. The MCP path
above is the supported route. See `docs/stitch_workflow.md` for the legacy SDK reference.
