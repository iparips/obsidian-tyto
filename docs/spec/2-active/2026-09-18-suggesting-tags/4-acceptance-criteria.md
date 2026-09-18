---
created: 2026-09-18
updated: 2026-09-18
---

# Acceptance Criteria

Whether a suggested tag is a good tag is a judgement no unit test makes. The suite asserts that the tool returns the vault's tags with counts, that the filter narrows, and that search off puts it out of reach. Whether the model lists before suggesting, and whether what it suggests belongs to the vault's own vocabulary, is what a person has to watch.

## Setup

- A real vault and a real API key, per CLAUDE.md on prompt changes
- A vault whose notes carry tags in both places: frontmatter on some, inline on others
- At least one tag used many times and one used once, so ranking is visible
- At least one nested tag, written as a parent and a child
- Searching turned on in settings

### The model suggests tags the vault already uses

```gherkin
Given a journal entry about a run and a doctor's appointment
When  the user says "suggest some tags for this entry"
Then  the panel shows a call listing the vault's tags
And   every tag suggested is one that call returned
```

A suggestion outside the returned list means the prompt line is not holding, and D4's stricter rule is what the fix becomes.

### A frontmatter tag is found as readily as an inline one

```gherkin
Given a vault where some notes tag in frontmatter and some inline
When  the model lists the vault's tags
Then  tags from both places appear in one list
```

This is the case a grep gets wrong, and the reason the tool reads the cache.

### The vault's convention outranks its typos

```gherkin
Given a tag used many times and a near-identical one used once
When  the model lists the vault's tags
Then  the frequent tag appears above the rare one
And   the model suggests the frequent one
```

### Applying a suggestion writes the tag

```gherkin
Given the model has suggested a tag the user accepts
When  the user says to add it
Then  the note holds the tag
And   the note's frontmatter still parses, where the tag went there
```

Broken YAML here is what reopens D1, since it is the risk the edit-tools decision carries.

### A vault with no tags is reported rather than invented around

```gherkin
Given a vault where no note carries a tag
When  the user asks for tag suggestions
Then  the model says the vault uses no tags
And   it proposes no tag of its own
```

### Search off leaves the tool unreachable

```gherkin
Given searching is turned off in settings
When  the user asks for tag suggestions
Then  the model says it cannot read the vault
And   no tag list reaches the panel
```
