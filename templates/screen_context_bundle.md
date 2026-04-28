# Screen Context Bundle

Use this template when redesigning an existing screen with DesignGate. Fill it out
before Step 2 (the interaction audit). DesignGate will reconcile the spec against your
declarations before asking any questions.

> **Important:** The User Capabilities field is your complete declaration of what must
> exist in the new design. DesignGate treats this as authoritative. It does not verify
> API correctness, runtime reachability, or deprecation status — those judgments are
> yours to make here. Code files listed below are an optional diagnostic lens only;
> they cannot introduce capabilities not declared above. UX patterns and interaction
> logic from existing code are never carried forward.

---

## Screen name

<!-- Identifier used in ux_decisions.md and capability maps. -->
<!-- Example: cv-upload, proof-dashboard, candidate-profile -->

## Intended user role(s)

<!-- Who this screen is for. Be explicit about what roles are excluded. -->
<!-- Example: "authenticated job-seeker — not admin, not recruiter" -->

## User capabilities

<!-- Complete list of actions the user can currently perform on this screen. -->
<!-- This is your declaration. DesignGate does not verify it against code. -->
<!-- Use verb phrases. One capability per line. -->
<!-- Example: -->
<!-- - Upload CV -->
<!-- - Delete proof -->
<!-- - Edit proof -->
<!-- - View proof status -->

-
-
-

## Capabilities to explicitly exclude

<!-- Anything that currently exists in code but MUST NOT carry into the new design. -->
<!-- Deprecated actions, admin-only features, out-of-scope product areas. -->
<!-- Example: -->
<!-- - admin_override (admin-only, not user-facing) -->
<!-- - bulk_export (descoped from this redesign) -->

-
-

## Data entities

<!-- Objects this screen operates on. Include relevant fields — not the full schema. -->
<!-- Only fields that affect screen behavior or display. -->
<!-- Example: -->
<!-- CV: id, filename, status (pending / verified / rejected), uploaded_at -->
<!-- Proof: id, type, status, cv_id -->

## Known intended UX changes

<!-- What the redesign explicitly changes in experience or flow. -->
<!-- This prevents DesignGate from asking about changes you've already decided. -->
<!-- Example: -->
<!-- - Replace modal upload flow with inline drag-and-drop -->
<!-- - Surface proof status inline on the CV card, not in a separate panel -->

## Component file(s)

<!-- Paths to relevant component files. Optional diagnostic lens only. -->
<!-- DesignGate reads these only to clarify what a declared capability does -->
<!-- when your description above is ambiguous. These files cannot add capabilities. -->

## State / store file(s)

<!-- Zustand stores or equivalent. Same purpose as component files above. -->
