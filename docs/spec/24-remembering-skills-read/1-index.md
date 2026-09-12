---
created: 2026-09-12
updated: 2026-09-12
---

# Refusals That Say What To Do Next: Spec

Two refusals report a block without naming the way past it. One strands the
model mid-turn; the other strands the user after it.

A second utterance in the same session is refused for not checking skills the
model already read. The refusal is untrue: the skill body is still in the chat
history, and the model can see it. Told twice that it has not done something it
has done, the model retries the edit instead, and the turn dies stuck.

A turn refused an unchosen open is then refused its edit, correctly, because the
note still bound is not the one it reached for. That refusal reaches the user as
a paraphrase of an instruction meant for the model. The user learns the request
failed, not that the note in front of them is still writable by saying so again.

- [0-prompt.md](0-prompt.md) - the block to hand a fresh session that will build it
- [2-requirements.md](2-requirements.md) - the reported session, and what the skill gate leaves unsaid
- [2a-refusal-replies.md](2a-refusal-replies.md) - the refused open, and the reply the user cannot act on
- [3-design.md](3-design.md) - the session record, the declared argument, and the reply rule
- [4-tasks.md](4-tasks.md) - build order in five commits, with the tests that hold each

Built.
