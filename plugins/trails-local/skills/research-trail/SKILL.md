---
name: research-trail
description: Use when the user wants to create, open, read, build, or update a Trails research path.
---

# Research trail

A trail is a compact record of how one research question develops. It is not a bookmark list or a chat transcript.

When the user asks to create a trail, call `create_trail` with the research question. Return the `open_url` so the user can open the live trail.

For an existing trail, reuse its private key in the current conversation. Before a context-dependent write, read the trail first.

Prefer a small number of meaningful steps. Add papers or notes because they change, support, challenge, or advance the research question. Use `why` to preserve that relation concisely.

Do not add every paper mentioned automatically. Keep ordinary literature search outside the trail until a result becomes relevant enough to retain.
