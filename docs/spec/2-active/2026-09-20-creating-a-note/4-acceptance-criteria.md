---
created: 2026-09-20
updated: 2026-09-20
---

# Acceptance Criteria

Whether the model reaches for the tool at the right moment, and writes a path the vault would recognise, is a judgement no unit test makes. These are the checks that need a real vault and a real key.

## Setup

- A vault with a folder holding several notes under a visible naming convention, such as dated weekly notes
- Search enabled, and commandAllowList emptied, which is the configuration this spec exists for
- A configured API key, on the model Ilya runs day to day

### A note that does not exist is created and written in one turn

```gherkin
Given a vault holding no note for a topic the user names
When  the user says to make a note about it and put a line in it
Then  the panel shows the path offered for confirmation
And   confirming creates the note, opens it, and the line lands in it
```

A turn that ends having created an empty note is a partial pass: the create worked and the model did not follow it with an edit. Report it as such rather than as a failure of the tool.

### The path follows the vault's convention rather than the spoken title

```gherkin
Given a folder whose notes are named to a convention, such as 09-04-fri
When  the user asks for a new note in that folder, naming it in speech
Then  the model lists the folder before offering a path
And   the path it offers matches the convention rather than transcribing the words
```

This is the check the feature turns on. A model that offers a path without globbing first is the failure the prompt line is meant to prevent, and the wording is what changes if it fails.

### Declining creates nothing

```gherkin
Given the model has offered a path for a new note
When  the user declines
Then  no note and no folder appear in the vault
And   the turn ends saying what it was going to create
```

### An existing note is edited rather than created over

```gherkin
Given a note the user has already written
When  the user says something that could be read as making that note afresh
Then  nothing overwrites it
And   the turn either edits it or says the note already exists
```

The likely cause of a failure here is the refusal's wording rather than the guard: the guard is a unit test, and what the model does after being refused is not.

### A new folder is created only as deep as the path says

```gherkin
Given a path naming two folders the vault does not hold
When  the user confirms it
Then  both folders are created and the note sits in the deeper one
And   no other folder appears at the vault root
```

Run this on mobile as well as desktop. The folder creation is the same call on both, but the confirmation is a panel interaction, and the panel is what mobile changes.
