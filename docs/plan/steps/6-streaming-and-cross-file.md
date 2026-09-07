# E. Streaming on the phone, and F. Lifting the one-note limit

The mobile half of streaming, which needs ephemeral tokens rather than a raw
key. Ships as 1.1.0 into a plugin already listed.

- [ ] E1 Ephemeral token auth (3 h)
- [ ] E2 Fallback to batch when a mint fails (2 h)
- [ ] E3 Mobile exit test, then tag 1.1.0 (2 h)

## F. Lift the one-note limit

Last, deliberately. Writing to notes the user is not looking at is where a voice
plugin does real damage, so it goes to an audience that already trusts the
single-note behaviour.

- [ ] F1 Finish the cross-file skills spec (2 h)
- [ ] F2 Read a named note beyond the session note (3 h)
- [ ] F4 Per-target AGENTS.md and narrowed refusals (2 h)
- [ ] F5 Exit test against the host vault's own skills (2 h)

F1 gives feature 13 a testing strategy and an implementation order, matching
every other spec folder.

### F3. Create and append, with an undo story (3 h)

Needs a documented answer for undo, since vault.modify bypasses the editor
history that NoteEditor (Engine) relies on.

- [ ] Create a note the model named
- [ ] Append to a note beyond the session note
- [ ] Document what undo does
