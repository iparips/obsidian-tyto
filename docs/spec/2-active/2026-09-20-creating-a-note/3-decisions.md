---
created: 2026-09-20
updated: 2026-09-20
---

# Decisions

## Requirements

### D1: Does the tool take a flag for creating folders recursively? [open, blocking]

A path names folders that may not exist. Three shapes were considered, and the choice decides the tool's signature.

| Option                                         | Cost                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Always create every missing folder             | A typo in a folder name silently grows a tree, caught only by the user reading the path |
| A create_parents flag, defaulting to one level | A second argument the model gets wrong silently, and a refusal that reads as arbitrary  |
| Refuse any path whose folder is missing        | An utterance naming a new folder cannot be carried out at all                           |

The recommendation is the first. The confirmation already shows the whole path, so the user reading `4 - Archive/2027/Q1/notes.md` sees three new folders as plainly as they see one. A flag moves that judgement to the model, which is the party with the least information about the vault's shape.

The flag's stated benefit is a guard against a wrong path. It is a weak one: a model confident enough to invent a three-deep path is confident enough to pass the flag, and the refusal it would otherwise get says nothing the model can act on except to pass the flag and try again.

Blocking because it is the tool's signature, and a flag added later is a schema change the model has already been trained on this session's wording for.

### D2: Is create_note offered when search is off? [open, blocking]

The search setting governs whether the model reaches outside the open note. A create reaches outside it in the strongest sense: it adds one.

Offering it with search off leaves the model writing a path with nothing to check it against. glob_notes is how the convention is discovered, and a vault with search off has no glob, so every created path would be a guess from a spoken title.

The recommendation is to gate it on search. The cost is a vault that wants creating and not searching, which is a combination nothing in the spec suggests Ilya wants.

Blocking because it decides whether the tool joins SEARCH_TOOLS, and because NFR8's fixture test holds the release 3 prompt and tool list byte for byte for a bare vault. A tool offered unconditionally changes what that vault is sent.

### D3: Does create_note carry applicable_skills? [open]

GUARDED_TOOLS (Engine Tools) holds the four calls that open vault access and the four that write. A create is both: it is often a turn's first vault act, and it writes a file.

The recommendation is yes, on the requiresVaultAccess side rather than the edit side. A skill is where a vault says that a meeting note goes in one folder and a recipe in another, which is exactly what the model needs before writing a path.

Not blocking: adding it later is a schema change the gate already knows how to make, and the tool works without it.

### D4: What does a create do to the turn's target? [open]

Nothing else in the tool set both writes a file and rebinds the session. A create has to rebind, or the note it made is unreachable by the edit tools that follow.

That puts it under the stable-step-target rule from the multi-note-editing spec: a step that retargets refuses what follows. A create followed by an insert_at in one batch would be refused, which is the rule working, but it costs a step on every created note.

The design settles whether that is accepted or whether a create is exempt. The recommendation is to accept it, since the exemption would be the first hole in a rule that currently has none.

## Assumptions

- Obsidian's Vault.create rejects a path whose parent folder is missing, and createFolder creates one level. If create makes its own parents, the folder handling in this spec collapses to a single call and D1 loses most of its weight. Verify against the installed API typings before designing.
- A note created and then opened resolves to an editor the way one opened by open_note does, so moveSessionTargetNoteTo (Engine) needs no change. If a freshly created file has no editor to resolve against, the create lands in the same half-opened state 2026-09-17b covers, and the design needs that spec's wait.
- The user confirming a path is confirming the folders too. If Ilya wants the folder creation confirmed separately from the note, the confirmation becomes two prompts per create and D1's reasoning changes.
