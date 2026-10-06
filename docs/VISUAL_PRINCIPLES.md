# Trails visual principles

Trails should feel like a quiet editorial research workspace, not a generic SaaS dashboard.

These rules apply to product and interface changes unless a specific interaction requires otherwise.

## Hierarchy

Research content is the foreground. Navigation, account controls, and secondary actions should recede once the researcher is working.

Use spacing, alignment, type weight, and restrained color before adding containers or decoration. Important content should be easy to scan without making every element equally prominent.

The interface should remain dense enough for research work while feeling calm. Prefer progressive disclosure over showing every control and detail at once.

## Visual character

Keep the existing editorial palette and serif typography. The off-white paper, near-black ink, annotation blue, and stone neutrals are part of the identity.

Avoid glossy gradients, glass effects, generic startup cards, excessive rounded containers, and ornamental shadows.

Do not use thin divider lines as the main way to structure the page. Prefer whitespace, alignment, indentation, and quiet background changes. When a line is structurally meaningful, it should have enough visual weight to feel intentional.

Do not use decorative punctuation as UI separators. In particular, avoid middots, pipes, or repeated punctuation between small metadata labels. Use spacing or separate lines instead.

## Trail topology

The trail rail is a core identity element.

Paths are thick, organic brush ribbons using the actual Trails logo as the visual reference. The logo is a filled vector silhouette with uneven boundaries and sparse local voids, not a clean stroked line and not a filter effect. Trail links should follow that same construction: a mostly straight/orthogonal filled ribbon, slightly uneven outer edges, and only occasional asymmetrical unpainted defects. Do not create visible waves, spirals, procedural noise, regular dash patterns, repeated paper-colored cuts, or parallel gray/light-blue helper strokes. Nodes are solid irregular brush marks and may be slightly oversized relative to the ribbon. In the resting state, nodes have no lighter outline, halo, ring, or secondary contour; hover may enlarge them using the same solid color.

This logo-derived brush ribbon is a protected visual invariant. Do not alter the irregular filled silhouette, sparse local voids, node silhouette/size, resting node fill, or hover behavior during unrelated interface work. Change it only when the user explicitly asks to change the topology/brush visual style.

Topology may use orthogonal logic for readability, but the rendered stroke should still feel drawn rather than diagrammatic.

The active path uses annotation blue and is rendered above every inactive path. Inactive paths use stone or muted neutrals without becoming transparent enough to break node-edge continuity.

The focused path occupies the lane nearest the visible mark text. Node positions must align to the actual mark title line, not to surrounding metadata or the total row box. Opening a mark expands the visible path length naturally as later marks move down. Hovering a brush node should make it visibly larger without changing its meaning or color, so clickability is suggested directly by the topology.

Use one topology renderer only: the left SVG brush rail. Do not keep or reintroduce a second inline rail, duplicate node renderer, generic fallback graph, or dormant CSS path for an older topology. Old visual implementations should be removed rather than left beside the current one.

Branch presentation is temporarily paused while the split model is redesigned. When branching returns, a split must originate visually and semantically from a node, never from the middle of a connection.

## Marks

A mark has two layers:

1. permanent content that remains visible in the trail;
2. a secondary detail block that opens and closes from the corresponding topology node.

The permanent layer should stay compact and readable. Mark titles remain directly editable whether the detail block is open or closed. Mark titles may span multiple lines and should grow naturally rather than being forced into a single-line ellipsis. Their topology node stays anchored to the first title line so adding title lines does not move the node downward. The permanent note uses modest internal padding; the detail block may use slightly more, but should not feel substantially more padded than the note.

Paper/link type labels live in a dedicated right-hand metadata gutter outside the mark text column. Permanent text and expanded detail content must never run underneath that gutter. Node actions belong as quiet inline icon controls at the bottom right of the detail block rather than behind a separate overflow menu.

## Controls and copy

Controls should be obvious when needed and visually quiet when not in use. Use color and background state rather than unnecessary borders, size jumps, or decorative chrome.

Use short, direct labels. Prefer plain verbs for actions. Avoid prototype or implementation language in the visible interface unless it is necessary for the user to understand what will happen. Empty editable fields should use short neutral placeholders such as "context", "note", or "mark" rather than instructional sentences.

Keep interaction patterns consistent. If a topology node opens mark detail in one place, it should behave the same way everywhere.

Editable trail and mark titles should look like ordinary typography. Editing is indicated by the text caret only: no underline, focus box, glow, tinted background, or other chrome. Use a thick vertical caret with a stable visual weight and no blinking; center it on the character boundary rather than visibly favoring the preceding or following glyph. Browser spelling and grammar underlines are disabled inside the trail workspace because scientific terminology and notation make them noisy.

## Layout

Align related content deliberately. The title, description, topology, marks, and composer should read as one coherent research object. Use the same vertical gap between trail title and context as between context and the start of the trail. The empty mark composer should begin at the same height as its mark button and grow only when its text requires more room.

The sidebar is orientation, not the task. Keep it quieter than the trail content.

Allow enough vertical room for type, including descenders. Do not crop text to achieve compactness.

On smaller screens, preserve the same hierarchy rather than introducing a different visual language.

## External guidance

These principles are consistent with current interface guidance that emphasizes clear hierarchy, alignment, progressive disclosure, concise labels, and keeping supporting navigation from competing with primary work:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Apple layout guidance: https://developer.apple.com/design/human-interface-guidelines/layout
- Linear's 2026 interface refresh: https://linear.app/now/behind-the-latest-design-refresh
