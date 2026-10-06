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

Paths are thick, organic brush strokes with small irregularities and secondary fibers. Nodes are irregular brush marks. Never replace this with thin graph lines, generic circles, or clean mechanical wiring.

Topology may use orthogonal logic for readability, but the rendered stroke should still feel drawn rather than diagrammatic.

The active path uses annotation blue and is rendered above every inactive path. Inactive paths use stone or muted neutrals without becoming transparent enough to break node-edge continuity.

The focused path occupies the lane nearest the visible mark text. Node positions must remain aligned with the marks they represent. Opening a mark expands the visible path length naturally as later marks move down.

## Marks

A mark has two layers:

1. permanent content that remains visible in the trail;
2. a secondary detail block that opens and closes from the corresponding topology node.

The permanent layer should stay compact and readable. The detail layer can use a quiet filled surface to distinguish it from the surrounding page.

## Controls and copy

Controls should be obvious when needed and visually quiet when not in use. Use color and background state rather than unnecessary borders, size jumps, or decorative chrome.

Use short, direct labels. Prefer plain verbs for actions. Avoid prototype or implementation language in the visible interface unless it is necessary for the user to understand what will happen.

Keep interaction patterns consistent. If a topology node opens mark detail in one place, it should behave the same way everywhere.

## Layout

Align related content deliberately. The title, description, topology, marks, and composer should read as one coherent research object.

The sidebar is orientation, not the task. Keep it quieter than the trail content.

Allow enough vertical room for type, including descenders. Do not crop text to achieve compactness.

On smaller screens, preserve the same hierarchy rather than introducing a different visual language.

## External guidance

These principles are consistent with current interface guidance that emphasizes clear hierarchy, alignment, progressive disclosure, concise labels, and keeping supporting navigation from competing with primary work:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/design-principles
- Apple layout guidance: https://developer.apple.com/design/human-interface-guidelines/layout
- Linear's 2026 interface refresh: https://linear.app/now/behind-the-latest-design-refresh
