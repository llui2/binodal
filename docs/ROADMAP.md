# Roadmap

This document records the current implementation sequence for the tool. It is intentionally ordered around learning value: each step should make the product more useful while producing evidence for whether the next layer is justified.

The product principles remain the governing document. This roadmap is a working implementation order, not a commitment to ship every item.

## Current position

The beta already provides:

- arXiv paper lookup
- cached paper metadata
- public paper pages
- ORCID-authenticated participation
- threaded discussion
- paper-level views for discussion, references, and related work

The next stage is to make the paper record useful enough for navigation and repeated research use before adding conventional social-network machinery.

## Implementation order

### 1. General paper lookup

Allow lookup by more than an arXiv identifier:

- title
- author
- DOI
- arXiv URL or ID

The paper should eventually have a the tool-internal identity with external identifiers attached to it, rather than treating the arXiv ID as the permanent primary identity.

Why first: this removes the largest entry-point friction without changing the product model.

### 2. References

Make the References view real.

Each reference should be compact, resolvable where possible, and open into its own the tool paper record. This creates the first useful literature graph inside the tool.

Why next: references immediately turn a paper page from a destination into a navigation object.

### 3. Related papers

Build related-paper discovery from inspectable signals first:

- citation and reference relationships
- shared references
- shared authors
- bibliographic similarity
- semantic similarity later

Where practical, results should explain why they appeared, for example: "shares 9 references" or "cited by this paper."

Avoid starting with an opaque recommendation model.

### 4. Save

Introduce one low-friction personal signal: Save.

A researcher should be able to save a paper and view a simple saved-paper list.

Do not introduce likes, scores, reactions, reputation, follower counts, or several overlapping signals at once.

Why: Save is immediately useful to the researcher and creates the first endogenous signal for later discovery.

### 5. Generalize comments into activity

The long-term public object around a paper should not be limited to comments.

A minimal activity record should support:

- text
- optional URL
- researcher identity
- timestamp
- optional parent activity

This is deliberately generic. The URL can point to code, data, another paper, a derivation, replication, response, visualization, or other scientific material without the tool imposing a taxonomy prematurely.

A likely model is:

```text
paper
  activity
    text
    optional URL
    author
    timestamp
    parent activity
```

The existing discussion UI can remain while the underlying model becomes more general.

### 6. Researcher pages

Add public researcher pages based on ORCID identity.

A minimal page should show:

- name / ORCID
- public contributions
- scientific activity connected to papers

Avoid follower counts, badges, reputation scores, or prestige metrics.

Why: this starts connecting papers to people without turning the tool into a conventional social network.

### 7. Research sessions

Build the research-session model discussed during product exploration.

A session should capture how a researcher moves through papers over time, including branching paths such as references and related-paper jumps.

Example:

```text
Adaptive networks
│
├─ Paper A
│  ├─ Paper B      opened from reference 14
│  │  └─ Paper D
│  └─ Paper C      related paper
│
└─ Paper E
```

The system should record these relationships automatically where possible rather than requiring manual organization.

Goal: replace browser-tab chaos with a persistent, navigable record of a research exploration.

### 8. Personalized discovery

Only after the earlier layers exist should the tool build a personalized feed or priority system.

Possible inputs:

- saved papers
- authors
- citation/reference structure
- related-paper navigation
- research sessions
- public scientific activity
- recency and novelty

The question is not "what maximizes engagement?" but:

> What new work is probably worth this researcher's attention?

Where practical, the tool should expose why an item appeared and eventually allow researchers to modify ranking rules.

## Infrastructure work to add early

These are less visible but should arrive before public use grows:

- rate limiting for contribution endpoints
- abuse/reporting path
- stable public JSON representation for papers and activity
- exportable public contribution data
- external identifier model for DOI / arXiv and future sources
- basic observability and error monitoring

## Explicitly deferred

Do not prioritize these yet:

- upvotes or popularity scores
- reputation systems
- follower graphs
- elaborate tags or contribution taxonomies
- moderation hierarchies beyond what is operationally necessary
- conventional engagement feeds
- opaque recommendation systems
- generic AI paper summaries
- AI features that replace researcher-to-researcher interaction

## Product test

When evaluating a feature, ask:

1. Does it help a researcher discover, understand, or interact with scientific work or people?
2. Does it make the public scientific record more useful or durable?
3. Can it be introduced without imposing unnecessary structure before actual usage justifies it?
4. Does it serve the researcher rather than engagement, prestige, publisher workflow, or platform lock-in?

If not, it is probably outside the current core.
