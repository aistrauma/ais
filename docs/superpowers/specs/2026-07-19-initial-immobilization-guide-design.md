# Initial Immobilization Featured Guide Design

- **Date:** 2026-07-19
- **Status:** Approved for implementation planning
- **Surface:** Notes tab in the AIS Trauma Reference GitHub Pages app

## Objective

Add a featured Initial Immobilization Guide above the existing Notes search. The guide helps a clinician choose an injury location, scan the initial immobilization plan, see a labeled line diagram of the recommended device or position, and expand the full reviewed note.

This is an educational quick reference. It does not replace local protocols, orthopedic consultation, procedural supervision, or clinical judgment.

## Approved experience

The guide uses a two-stage interaction:

1. Choose a clinical section and injury.
2. Review a split workspace containing concise action bullets and a labeled immobilization diagram.

The skeleton concept is out of scope. Injury selection is explicit and text-first.

### Location navigation

The featured guide begins with section controls for:

- Upper extremity
- Lower extremity
- General principles
- Analgesia
- Traction

Selecting Upper or Lower extremity reveals a compact injury list. Each injury row includes the injury name and its usual initial device or management category. The first available injury is selected by default.

General principles, Analgesia, and Traction use the same workspace, but the left rail lists topics rather than fracture locations.

### Split clinical workspace

On desktop, the selected injury opens a three-part workspace:

- Injury rail: location and injury choices.
- Quick guide: three to five concise actions, a prominent reassessment or escalation warning when applicable, and an Expand full guide control.
- Visual panel: a labeled line diagram of the recommended device, positioning, or traction setup.

On screens narrower than 768 px, the order becomes:

1. Injury selector
2. Quick guide
3. Diagram
4. Expanded content

The selected injury remains visually obvious after the layout stacks.

### Expand behavior

The Expand full guide control reveals the selected injury's detailed note content within the featured guide. It does not navigate the user away from Notes or discard the current selection.

The expanded state includes the selected injury's full guidance plus links to the note sources and the standard educational disclaimer. Collapse returns to the quick state without changing the selected injury.

## Content scope

The attached Initial Immobilization Guide is the editorial starting point. The published content includes only material that has been checked against authoritative sources and separately clinically reviewed.

### General topics

- General reduction principles
- Pediatric both-bone forearm reduction principle
- Hematoma block
- Intra-articular shoulder block
- Bier block
- Splinting technique
- Position of function

### Upper-extremity injuries

- Clavicle fracture
- Scapula fracture
- Shoulder dislocation
- Proximal humerus fracture
- Humeral shaft fracture
- Distal humerus fracture
- Olecranon fracture
- Radial head fracture
- Elbow dislocation
- Terrible triad of the elbow
- Forearm fracture
- Distal radius fracture

### Lower-extremity injuries

- Femoral neck fracture
- Intertrochanteric fracture
- Subtrochanteric fracture
- Femoral shaft fracture
- Distal femur fracture
- Patella fracture
- Tibial plateau fracture
- Complex tibial plateau or proximal tibia fracture

### Traction topics

- Buck traction
- Skeletal traction
- Traction-splint contraindications

## Visual system

The visual direction is a restrained clinical version of soft structuralism that preserves the app's existing teal brand.

### Diagram style

- Code-native SVG, not generated bitmap art.
- Simplified but anatomically coherent limb outlines.
- Teal for labels and guidance.
- Muted orange for the active immobilizer and urgent cautions.
- Neutral layers for bone, skin outline, padding, and wrap.
- Leader lines terminate at the exact structure or device feature being described.
- Labels explain only clinically useful details, such as device path, visible digits, pressure-point padding, or joint position.
- Every diagram has a concise accessible name and a longer text description available to assistive technology.
- Dark mode uses existing semantic color variables rather than fixed light-only fills.

### Reusable diagram library

Use reusable diagrams for repeated management patterns rather than creating one illustration per diagnosis:

- Sling
- Sling and swathe
- Coaptation splint
- Posterior long-arm splint
- Sugar-tong splint
- Volar wrist or short-arm splint
- Hand position of function
- Knee immobilizer
- Long-leg posterior splint
- Traction splint
- Buck traction
- Skeletal traction overview
- Position of comfort or no routine device

Injury-specific labels may be layered on a reusable base diagram when the position or caution differs.

## Information architecture and source files

The existing Markdown Notes system remains canonical for reviewed prose and sources.

### Canonical note

Create `notes/initial-immobilization-guide.md` using the existing required front matter. The note contains the full reviewed guidance, authoritative HTTPS sources, and a `last_reviewed` date.

### Featured-guide data

Create a small companion JavaScript data module for UI-only metadata:

- section
- injury or topic label
- short device label
- three to five quick bullets
- escalation or reassessment warning
- diagram identifier
- canonical Markdown heading identifier
- search terms

The full prose is not duplicated in this module. The build validates that every featured-guide entry points to a heading in the canonical note.

### Generated output

The build produces a generated section index for the guide alongside the existing Notes index and sanitized note fragments. The browser uses that generated index to load only the selected full section when the user expands it.

Generated files are never edited by hand.

## Component boundaries

### Featured guide shell

Owns loading, empty, and error states. It appears above the existing Notes search only when the generated guide index is valid.

### Section navigation

Owns section selection and exposes keyboard-operable buttons with `aria-pressed`.

### Injury rail

Owns injury or topic selection. It uses native buttons, visible focus, and `aria-current` for the selected item.

### Quick guide

Renders the short actions, reassessment warning, and expand or collapse control. Content is inserted as text, not raw HTML.

### Diagram panel

Maps the selected diagram identifier to a reusable inline SVG component. Unknown identifiers render a clear text fallback rather than a broken image.

### Expanded detail

Fetches the generated sanitized section fragment for the selected item. It preserves the selected injury and ignores stale responses if the user changes selection while a request is in flight.

## Interaction details

- Click, tap, keyboard activation, and focus all provide the same information.
- Hover is decorative feedback only and is never required to access content.
- Changing injury collapses any previously expanded detail and updates the quick guide and diagram together.
- The workspace uses restrained state transitions based on opacity and transform.
- `prefers-reduced-motion` disables nonessential transitions.
- The current Notes search and standard note routes remain unchanged.
- The featured guide does not use an external CDN, API, runtime service, or tracking dependency.

## Loading and failure behavior

- While the generated guide index loads, render a skeleton matching the final workspace proportions.
- If the featured guide cannot load, show a compact retry control and keep the existing Notes search fully usable.
- If a selected expanded section fails, keep the quick guide and diagram visible and show an inline retry control for the detail only.
- If the guide index is empty or invalid, do not render a misleading empty workspace.
- A stale detail response must never overwrite the currently selected injury.

## Accessibility

- All selection controls are native buttons.
- Tab order follows the visual and clinical reading order.
- Focus remains on the activated selector after rerender.
- The selected section and injury are programmatically exposed.
- Diagram meaning is fully available as text. Color is not the sole carrier of information.
- Contrast meets WCAG AA in light and dark themes.
- Desktop, tablet, and 320 px mobile layouts must not create horizontal page scrolling.

## Clinical publication requirements

Before merge:

- Check every procedural, positioning, weight, and contraindication statement against current authoritative sources.
- Include source links that collectively cover reduction principles, common splint types, traction use, pediatric considerations, and major escalation criteria.
- Confirm the note contains no PHI or patient-specific detail.
- Set `last_reviewed` to the actual clinical review date.
- Obtain separate clinical review of both text and diagrams.
- Keep the educational disclaimer visible in quick and expanded states.
- Do not merge if a diagram could teach an incorrect device path, joint position, or traction setup.

## Testing and acceptance criteria

### Build and data validation

- The canonical Markdown note passes the existing note schema.
- Every featured-guide entry maps to an existing canonical heading.
- Every diagram identifier maps to a registered diagram.
- Every item has quick bullets, search terms, and an accessible diagram description.
- Unsafe HTML is removed from generated detail fragments.

### UI tests

- The featured guide renders above Notes search.
- Section and injury selection update the quick guide and diagram together.
- Expand and collapse preserve selection.
- Stale detail responses cannot overwrite a newer selection.
- Guide failure does not disable standard Notes search.
- Unknown diagrams render the text fallback.
- Keyboard selection and focus preservation work after rerender.

### Browser verification

- Verify light and dark themes.
- Verify keyboard-only navigation.
- Verify reduced motion.
- Verify widths of 320 px, 390 px, 768 px, and desktop.
- Verify the live GitHub Pages path and service-worker cache after deployment.
- Spot-check at least one injury for every reusable diagram type.

### Completion criteria

The feature is complete when the full test suite and build pass, the featured guide works offline after caching, the draft pull request contains the clinically reviewed note and diagrams, and no unrelated `sites-hosted/` files are staged or committed.

## Release strategy

Implement on `agent/initial-immobilization-guide`. Commit source, tests, and generated build output intentionally. Push the branch and open a draft pull request against `main`.

Merging remains blocked until the separate clinical review is documented. After merge, verify the GitHub Pages workflow and the live Notes tab.
