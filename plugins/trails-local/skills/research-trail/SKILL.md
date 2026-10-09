---
name: research-trail
description: Use when the user wants to create, open, read, build, or update a Trails research path.
---

# Research trail

A trail is a compact record of how one research question develops. It is not a bookmark list or a chat transcript.

When the user asks to create a trail, call `create_trail` with a short descriptive `title` and a longer `description` of the research problem. Return the `open_url` so the user can open the live trail.

For an existing trail, reuse its private key in the current conversation. Before a context-dependent write, read the trail first. The marks returned by `get_trail` have stable IDs.

Use `add_trail_mark` to create a note, code, link, or paper, optionally positioned relative to other marks by their IDs. Use `edit_trail_mark` to correct or extend an existing mark, and `move_trail_mark` to revise the argument's order. Prefer revising existing marks over creating redundant ones.

`delete_trail_mark` is destructive. Call it only when the user explicitly approves removing a specific mark; send its current exact title and the confirmation field. Do not treat a general request to tidy or reorganize a trail as permission to delete research content.

Prefer a small number of meaningful steps. Add papers or notes because they change, support, challenge, or advance the research problem. Keep each node title compact and specific; paper nodes default to the paper title. Use `why` only as secondary context, not as the node title.

Do not add every paper mentioned automatically. Keep ordinary literature search outside the trail until a result becomes relevant enough to retain.
