# Trails product principles

trails exists to help researchers find relevant work and engage with each other around it.

The paper is a stable reference object and a natural point of entry, but it is not the center of the product. Researchers and their evolving research process are the primary actors; scientific interaction is the primary value.

## Product model

trails should connect three things:

**Discover -> Understand -> Interact**

Papers provide a shared coordinate system underneath them. Trails preserve how researchers move through that coordinate system.

A paper page should work primarily as a compact lookup record: what the work is, why it may matter, what activity surrounds it, who is engaging with it, and where to go next. A paper may also be the starting point of a research session or trail.

Search should get a researcher into an evolving exploration rather than become the main product. The information need may change as the researcher encounters papers, claims, methods, people, and contradictions.

## Trails as research state

A trail is not a browser history, bookmark collection, chat transcript, or exhaustive activity log. It is a compact external representation of meaningful research state.

A useful trail can contain papers, claims, evidence, questions, decisions, rejected branches, notes, code or analyses, results, artifacts, people, and unresolved directions. The important relation is not only that an object was visited, but why it mattered in the evolving argument.

Prefer meaningful semantic actions over low-level event capture. Opening a paper can remain ephemeral; following it because it challenges an assumption may be worth preserving.

The system should distinguish between:

**ephemeral -> saved to trail -> shared or published**

Most activity should remain ephemeral. Researchers should not have to maintain a manual research diary, and automatic capture should not create an unreadable surveillance log.

The trail should function as an external cognitive object: something a researcher can inspect, branch, reorganize, question, revisit, and share. Complexity may exist underneath, but the visible representation should remain compact, with details available on demand.

The shared example trail is a disposable template, not persistent research state. Edits made while testing it may live during the current page session, but a full page reload restores the canonical example. Personal trails remain persistent.

## Shared human-agent context

A trail should also be usable as persistent context for research agents.

The canonical state should not be a chat transcript. Chat is one interface through which a human or agent can inspect and modify the same research state.

An agent entering a trail should be able to recover the current question, relevant papers, important claims and evidence, decisions and rejected branches, unresolved questions, and produced artifacts without requiring the researcher to reconstruct that context in every prompt.

When an agent performs consequential work, preserve the externally useful research trace: what it did, what evidence it used, what changed, what remains uncertain, and a concise justification for important decisions.

Do not expose or depend on private chain-of-thought. Scientific accountability should come from inspectable claims, evidence, actions, provenance, uncertainty, and reasons that the agent is willing to state publicly.

Agents should be selectively steerable. Researchers should be able to inspect a meaningful step, ask why it happened, correct it, branch from it, or continue from that state without supervising every low-level action.

External APIs, plugins, and agent integrations should therefore treat trails as shared research memory. A researcher should be able to work through a chat system, the trails web interface, or another compatible agent while operating on the same underlying trail.

## Researcher-first

trails is infrastructure for academics and should serve researchers rather than publishers, advertisers, or engagement-driven platform incentives.

Product decisions should optimize for scientific usefulness, researcher autonomy, and durable public knowledge.

Avoid mechanisms whose main purpose is to increase time on site, virality, status competition, or dependence on trails.

## Low-friction participation

Useful participation should often take seconds, not require writing a post.

Prefer lightweight scientific signals where they carry enough meaning:

- tags and small reactions
- saves and follows
- short notes
- links to code, data, derivations, replications, responses, or related work
- author clarifications and additional material

Long discussion remains possible, but it should not be the default unit of participation.

The interface should remain visually quiet, compact, and low-verbosity. A paper record or trail overview should be readable at a glance.

## Discovery as prioritization

The literature is too large for chronological browsing alone. trails should help each researcher establish a priority over papers.

Ranking may use topic similarity, reading and saving history, citation/reference structure, trusted researchers, public activity, novelty, and recency.

The goal is not to predict what maximizes engagement. The goal is to estimate what is worth the researcher's attention.

## Transparent algorithms

Recommendation and ranking should be inspectable and controllable.

Whenever practical, a researcher should be able to understand why an item appears and adjust the factors that produced the ranking.

Social signals should help navigation without becoming opaque popularity scores. Metrics should not become another academic prestige system.

Researchers should eventually be able to create, modify, and share ranking or filtering rules.

## Interaction and collaboration

Discovery should include people as well as papers.

trails should surface meaningful scientific connections: researchers working on related problems, independent uses of similar methods, possible collaborators, replications, extensions, and relevant discussion.

A recommendation to another researcher should explain the scientific connection rather than rely on generic social-network similarity.

Trails should support both human-human and human-agent collaboration through the same research objects and state rather than placing these interactions in separate product silos.

## Agents

Agent-like features should work for researchers.

Good uses include watching the literature, maintaining a reading queue, explaining why new work is relevant, tracking developments around a paper, finding related methods or results, testing branches of an argument, and detecting useful researcher-to-researcher connections.

Agents should reduce search and coordination costs while bringing researchers back into contact with papers, evidence, and people. They should not replace scientific interaction with generic AI summaries or opaque autonomous conclusions.

## Openness

trails should not try to become the canonical owner of papers or scholarly identity.

Public contributions should be addressable and, where practical, exportable. Prefer open identifiers and interoperable data. Avoid unnecessary lock-in.

The trail model should also be interoperable enough that external research tools and agents can read or contribute to a trail under explicit user control.

## Failure modes to avoid

Do not drift into:

- a generic comment section for papers
- a conventional engagement-maximizing social feed
- a popularity or prestige leaderboard
- an opaque recommendation engine
- a publisher workflow product
- a generic AI literature summarizer
- a chat transcript presented as research memory
- an exhaustive activity log presented as provenance
- a system that requires researchers to manually document every step
- an agent interface that hides consequential actions or requires continuous supervision
- a system where the AI layer displaces researcher-to-researcher interaction

When evaluating a feature, ask whether it helps a researcher discover, understand, preserve, extend, or interact with scientific work, reasoning, or people more effectively. If not, it is probably outside trails's core.
