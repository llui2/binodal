# AGENTS.md

Before making product, interface, ranking, discovery, social, or agent-related decisions in this repository, read [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md).

Treat those principles as product constraints, not aspirational copy.

In particular:

- trails serves researchers, not engagement or publisher incentives.
- Papers are stable reference objects and useful entry points, but the evolving research process is the deeper product object.
- Treat a trail as persistent, structured research state: a shared external memory that humans and agents can both read and extend.
- Chat is an interaction surface, not the canonical research record. Important actions, evidence, decisions, uncertainties, and artifacts should be reflected into the trail with concise public justifications.
- Never design around exposing private chain-of-thought. Preserve inspectable scientific reasoning through claims, evidence, actions, provenance, and stated reasons.
- Capture meaningful semantic research actions, not an exhaustive clickstream. Keep ordinary activity ephemeral unless it becomes useful research context.
- Prefer low-friction, structured scientific signals over forcing long-form comments or manual research diaries.
- Search should help a researcher enter an evolving exploration; do not let search or the paper page become the whole product.
- Discovery should prioritize relevance to the individual researcher rather than chronology or virality alone.
- Ranking and recommendation should be inspectable and controllable where practical.
- Social features should support scientific connection without creating prestige mechanics.
- Agent features should reduce search and coordination costs, remain steerable, and strengthen researcher-to-researcher interaction.
- Design external APIs/plugins so research agents and chat systems can operate on the same trail state as the web interface.
- Keep the interface compact, visually quiet, and low-verbosity. Prefer overview first and details on demand.
- Preserve openness and avoid unnecessary platform lock-in.

For implementation work, keep the current MVP constraints in mind, but do not introduce architecture or UI choices that make these longer-term principles unnecessarily difficult to reach.
