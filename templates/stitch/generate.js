/**
 * DesignGate — Stitch UI Generation Script
 *
 * Generates UI screen designs via the Google Stitch SDK. Outputs a manifest
 * of screen IDs and preview image URLs for human review before screens are
 * pulled as HTML for component conversion.
 *
 * Usage:
 *   node generate.js --list                        # list all defined screens
 *   node generate.js --stage dashboard             # generate all screens in a group
 *   node generate.js --stage dashboard --screen main  # single screen
 *   node generate.js --pull abc123,def456          # pull HTML by screen ID
 *
 * Prerequisites:
 *   cd scripts/stitch && npm install
 *   STITCH_API_KEY must be set in ../../.env
 */

import { Stitch, StitchToolClient } from "@google/stitch-sdk";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Load environment
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");

const envVars = readFileSync(envPath, "utf-8")
  .split("\n")
  .filter((line) => line.includes("=") && !line.startsWith("#"))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split("=");
    acc[key.trim()] = rest.join("=").trim();
    return acc;
  }, {});

const apiKey = envVars["STITCH_API_KEY"];
if (!apiKey) {
  console.error("ERROR: STITCH_API_KEY not found in .env");
  console.error("Add STITCH_API_KEY=your-key to the .env file in the repo root.");
  process.exit(1);
}

const client = new StitchToolClient({ apiKey });
const stitch = new Stitch(client);

// ---------------------------------------------------------------------------
// Brand constants — injected into every prompt automatically
//
// Replace this with your product's brand system. Every screen prompt will
// include this block automatically — do not add it manually per-screen.
// ---------------------------------------------------------------------------

const BRAND = `
Design system:
- Product: "YOUR PRODUCT NAME — your tagline here"
- Colors: [primary color + hex], [background color + hex], [accent color + hex], [secondary text color + hex]
- Typography: [UI font] for all UI/body text, [heading font] for headings only
- UI character: [describe the feel — e.g. "clean, minimal, professional. No decorative elements."]
- Navigation: [describe nav pattern — e.g. "persistent left sidebar on desktop"]
- Buttons: primary = [describe], secondary = [describe]
- Cards: [describe card style]
- Platform: desktop web, 1280px wide reference frame.
`.trim();

// ---------------------------------------------------------------------------
// Screen definitions
//
// Organise screens into groups (stages, features, flows — whatever suits your
// project). Each group maps to a Stitch project.
//
// Each screen needs:
//   label  — human-readable name shown in --list output and manifests
//   prompt — full Stitch prompt. Always start with ${BRAND}, then auth context,
//            then layout, content, actions, and edge states.
//
// Prompt writing rules:
//   1. Auth context first: "This screen is visible to [logged-in users only /
//      logged-out users / all users]." Stitch defaults to full app chrome if
//      you don't specify — wrong for error pages, landing pages, auth screens.
//   2. Name CTAs explicitly: list what buttons should appear AND what should not.
//   3. Specify every edge state: empty, loading, error, zero results.
//   4. Be explicit about layout: sidebar vs top-nav, panel vs full page, modal
//      vs inline. Do not leave structural decisions to inference.
// ---------------------------------------------------------------------------

const SCREENS = {
  // Replace "example" with your first feature/stage/flow name.
  // The key becomes the --stage argument and the Stitch project name.
  example: {
    name: "Example — Main Screens",
    screens: {
      // Replace with your actual screens.
      "home": {
        label: "Home — Main View",
        prompt: `
${BRAND}

This screen is visible to logged-in users only.

Screen: [Describe what this screen does and who uses it]

Layout: [Describe the layout structure — sidebar, top nav, content zones]

Content:
- [Header / page title]
- [Primary content area — what goes here]
- [Secondary content — sidebars, panels, metadata]

Actions:
- Primary CTA: "[Button label]" — [placement, behavior]
- Secondary: "[Button label]" — [placement, behavior]
- Do not include: [list what should NOT appear here]

Edge states:
- Empty state: [what does a new user see with no data?]
- Loading state: [skeleton, spinner, or placeholder?]
- Error state: [what shows if the data fails to load?]
        `.trim(),
      },
    },
  },
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const stageArg = getArg("--stage");
const screenArg = getArg("--screen");
const pullArg = getArg("--pull");
const listFlag = hasFlag("--list");

// ---------------------------------------------------------------------------
// List mode
// ---------------------------------------------------------------------------

if (listFlag) {
  console.log("\nDefined screens:\n");
  for (const [stage, def] of Object.entries(SCREENS)) {
    console.log(`--stage ${stage}  →  ${def.name}`);
    for (const [key, screen] of Object.entries(def.screens)) {
      console.log(`  --screen ${key}  →  ${screen.label}`);
    }
    console.log();
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Pull mode — fetch HTML for approved screen IDs
// ---------------------------------------------------------------------------

if (pullArg) {
  const ids = pullArg.split(",").map((s) => s.trim());
  console.log(`\nPulling HTML for ${ids.length} screen(s)...\n`);

  const outputDir = resolve(__dirname, "output");
  mkdirSync(outputDir, { recursive: true });

  for (const screenId of ids) {
    try {
      console.log(`Fetching screen: ${screenId}`);
      const projects = await stitch.projects();
      let found = null;
      for (const project of projects) {
        const screens = await project.screens();
        found = screens.find((s) => s.id === screenId);
        if (found) break;
      }
      if (!found) {
        console.error(`  ✗ Screen ${screenId} not found in any project`);
        continue;
      }
      const htmlUrl = await found.getHtml();
      const outPath = resolve(outputDir, `${screenId}.html.url.txt`);
      writeFileSync(outPath, htmlUrl);
      console.log(`  ✓ HTML URL written to output/${screenId}.html.url.txt`);

      // Fetch and save the HTML itself
      const res = await fetch(htmlUrl);
      if (res.ok) {
        const html = await res.text();
        writeFileSync(resolve(outputDir, `${screenId}.html`), html);
        console.log(`  ✓ HTML saved to output/${screenId}.html`);
      } else {
        console.warn(`  ⚠ Could not fetch HTML (${res.status}). URL saved — re-run --pull to retry.`);
      }
    } catch (err) {
      console.error(`  ✗ Error fetching ${screenId}:`, err.message);
    }
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Generate mode
// ---------------------------------------------------------------------------

if (!stageArg) {
  console.error("ERROR: Provide --stage <name>, --list, or --pull <id1,id2>");
  console.error("Example: node generate.js --stage example");
  process.exit(1);
}

const stageDef = SCREENS[stageArg];
if (!stageDef) {
  console.error(`ERROR: No screens defined for stage "${stageArg}"`);
  console.error(`Defined stages: ${Object.keys(SCREENS).join(", ")}`);
  process.exit(1);
}

const screensToGenerate = screenArg
  ? { [screenArg]: stageDef.screens[screenArg] }
  : stageDef.screens;

if (screenArg && !stageDef.screens[screenArg]) {
  console.error(`ERROR: Screen "${screenArg}" not found in stage "${stageArg}"`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
//
// SDK v0.0.3 note: project.generate() parses the API response incorrectly
// (expects outputComponents[0].design.screens[0], gets designSystem instead).
// Screens are created server-side as a side effect; we diff list_screens
// before/after to discover new screen IDs. The same bug affects Screen.edit()
// and Screen.variants() — both are bypassed with client.callTool() directly.
// ---------------------------------------------------------------------------

const extractScreenId = (name) => name.split("/screens/").pop();

const listScreenIds = async (projectId) => {
  const res = await client.callTool("list_screens", { projectId });
  return new Set((res.screens || []).map((s) => extractScreenId(s.name)));
};

const listNewScreens = async (projectId, beforeIds, retries = 18, delayMs = 10000) => {
  // Stitch creates screens asynchronously — can take 2-3 minutes to appear.
  for (let i = 0; i < retries; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await client.callTool("list_screens", { projectId });
    const newScreens = (res.screens || []).filter((s) => !beforeIds.has(extractScreenId(s.name)));
    const desktop = newScreens.filter((s) => s.deviceType === "DESKTOP");
    const result = desktop.length > 0 ? desktop : newScreens;
    if (result.length > 0) return result;
    process.stdout.write(`  (waiting for screen... ${(i + 1) * 10}s)\r`);
  }
  return [];
};

// ---------------------------------------------------------------------------
// Find or create Stitch project, then generate
// ---------------------------------------------------------------------------

const projectTitle = `designgate-${stageArg}`;
const existingProjects = await stitch.projects();
const existing = existingProjects.find((p) => p.data?.title === projectTitle);
const project = existing ?? (await stitch.createProject(projectTitle));
console.log(`\nProject: ${projectTitle} (id=${project.id})\n`);

const outputDir = resolve(__dirname, "output");
mkdirSync(outputDir, { recursive: true });

const manifestPath = resolve(outputDir, `${stageArg}-manifest.json`);
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf-8"))
  : { stage: stageArg, generatedAt: new Date().toISOString(), screens: {} };

console.log(`Generating ${Object.keys(screensToGenerate).length} screen(s)...\n`);

for (const [key, screenDef] of Object.entries(screensToGenerate)) {
  console.log(`→ ${screenDef.label}`);

  try {
    const beforeIds = await listScreenIds(project.id);

    await client.callTool("generate_screen_from_text", {
      projectId: project.id,
      prompt: screenDef.prompt,
    });

    const newScreens = await listNewScreens(project.id, beforeIds);
    if (newScreens.length === 0) throw new Error("No new desktop screen found after generation");

    const primary = newScreens[0];
    const primaryId = extractScreenId(primary.name);
    const imageUrl = primary.screenshot?.downloadUrl ?? "";

    const variantData = [];
    try {
      const variantBeforeIds = await listScreenIds(project.id);
      await client.callTool("generate_variants", {
        projectId: project.id,
        selectedScreenIds: [primaryId],
        prompt:
          "Generate 2 additional design variants. Explore different layout approaches " +
          "while keeping the same brand system, color palette, and content.",
        variantOptions: { variantCount: 2, creativeRange: "EXPLORE" },
        deviceType: "DESKTOP",
      });
      const variantScreens = await listNewScreens(project.id, variantBeforeIds);
      for (const v of variantScreens) {
        variantData.push({ id: extractScreenId(v.name), imageUrl: v.screenshot?.downloadUrl ?? "" });
      }
    } catch (varErr) {
      console.warn(`  ⚠ Variants failed: ${varErr.message}`);
    }

    manifest.screens[key] = {
      label: screenDef.label,
      primaryScreenId: primaryId,
      primaryImageUrl: imageUrl,
      variants: variantData,
      chosenScreenId: null,
    };

    console.log(`  ✓ Screen ID: ${primaryId}`);
    console.log(`  ✓ Preview:   ${imageUrl}`);
    for (const v of variantData) {
      console.log(`  ✓ Variant:   ${v.id}  ${v.imageUrl}`);
    }
    console.log();
  } catch (err) {
    console.error(`  ✗ Failed: ${err.message}\n`);
    manifest.screens[key] = { label: screenDef.label, error: err.message };
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest saved to: output/${stageArg}-manifest.json`);
console.log("\nNext steps:");
console.log("1. Open the preview URLs above in your browser");
console.log("2. Review and refine in the Stitch web UI if needed");
console.log(`3. Tell Claude which screen ID to use — or run: node generate.js --pull <screen-id>`);
