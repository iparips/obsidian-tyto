# Requirements: Choosing the Note

Give the user one interaction that answers which note and whether to write to
it. Retire the confirmation that answered only the second.

## Table of Contents

1. [Problem](#problem)
2. [Goals](#goals)
3. [Non-goals](#non-goals)
4. [User stories](#user-stories)
5. [One choice, not two questions](#one-choice-not-two-questions)
6. [What each scope holds](#what-each-scope-holds)
7. [Requirements](#requirements)
8. [Non-functional requirements](#non-functional-requirements)
9. [What the design must settle](#what-the-design-must-settle)

## Problem

The model finds several notes and has to pick one before the user sees any of
them. [9-model-chosen-targets](../9-model-chosen-targets/1-index.md) then asks
about the one it picked: "Open 09-04-Fri.md and edit it?"

Declining that is a dead end. The user has said no to one note without saying
which note was right, so the model either guesses again or falls back to
ask_user. A real turn did both: it asked through the confirmation, was declined,
then asked the same question again as free text.

The second ask is worse than redundant. An answer typed into ask_user is prose,
so nothing records that the user consented to anything. The model reads "yes",
believes it has permission, and the only real gate never fires.

Two questions are being asked of one decision. Which note did you mean, and may
I write to it. The user answers both by pointing at a note, and the design has
no way to let them.

## Goals

- Let the user pick from what the model found, rather than judge one guess.
- Make the pick the consent, so nothing infers permission from prose.
- Keep a note the model found reachable for the session, since finding it is
  knowledge.
- Keep consent to the turn, since it is about the write in front of the user.
- Say what a decline means, so a refused shortlist does not become a retry loop.
- Cost one interaction, not two.

## Non-goals

- Creating a note at a chosen path. Still release 13.
- Approving a command. A command opens its own note and the allow-list is what
  gates it.
- Choosing anything but a note: a folder, a heading, a block.
- Multi-select. One write goes to one note.
- Remembering a choice across sessions. Consent that outlives the app is a
  setting, not a pick.

## User stories

- As a user, I see the notes the model found and pick the one I meant, rather
  than being asked about its first guess.
- As a user, my pick opens that note and no other, so choosing is also allowing.
- As a user, I decline a shortlist that has nothing right in it and the model
  asks what I meant rather than guessing again.
- As a user, a turn that edits one note three times asks me once.
- As a user, a new instruction asks again, even for the note I just chose.
- As a user with a note the model found last turn, opening it does not need
  another search.
- As a user in auto mode, nothing asks and the model opens what it found.

## One choice, not two questions

| Today                      | Answers        | Leaves open               |
| -------------------------- | -------------- | ------------------------- |
| Confirmation: "open this?" | Consent        | Which note the user meant |
| ask_user: "which one?"     | Identification | Whether it may be written |

One tool answers both, because the answer to both is a path. A user who points
at Week-35's Friday note has said which note and said yes in the same act.

That is what makes the decline meaningful too. Declining a shortlist says none
of these, which is a different answer from no to one note, and the model can act
on it rather than guessing which way the no pointed.

## What each scope holds

Two facts with two lifetimes, kept apart because collapsing them is what made
the failure confusing.

| Fact                   | Scope   | Why                                                                       |
| ---------------------- | ------- | ------------------------------------------------------------------------- |
| The model found a note | Session | Finding is knowledge, and it does not go stale in a way a re-search fixes |
| The user chose a note  | Turn    | Consent is about the write in front of them, not every later write        |

A session-scoped choice would let one yes license every future edit to that
note. A turn-scoped find would make the model re-search a note the user watched
it find, which is what drove a turn to edit whatever was still bound.

## Requirements

### Choosing a note

FR1. Give the model a tool that offers the user a shortlist of note paths and
returns the one they chose.

FR2. Require the tool for every model-chosen open, including a shortlist of one,
so no note is written to before the user has seen it named.

FR3. Show the vault-root path for each candidate and nothing else, so a note is
identified by where it lives.

FR4. Return the chosen path to the model as the tool result, so the model reads
which note it may open.

FR5. Record the chosen path as consent for the turn, so opening it needs no
further question.

### Declining a shortlist

FR6. Let the user decline every candidate, distinctly from choosing one.

FR7. Tell a model whose shortlist was declined to ask the user what they meant,
rather than searching again or opening anything.

FR8. Leave the session's bound note untouched when a shortlist is declined, and
write nothing.

### Opening what was chosen

FR9. Refuse an open of a note the user has not chosen this turn, naming the
choosing tool.

FR10. Keep the existing refusal for a path no search returned, since a path the
model invented is a different error from one the user has not chosen.

FR11. Let a note chosen this turn be reopened without asking again, so a command
that moves the target away costs no second question.

### Retiring the confirmation

FR12. Remove the yes/no confirmation and its panel entry.

FR13. Offer the choosing tool nowhere when the vault is in auto mode, which
opens the first note the model offers without asking. Auto mode today opens the
one note the model named; a shortlist gives it several, and taking the first is
a decision rather than a translation.

FR14. Keep ask_user for what it is for: a question whose answer is not a note.

FR15. Cap the shortlist, and tell a model that offers more to narrow its search
first. A glob returns fifty notes, and a picker of fifty is a list rather than a
choice.

FR16. Keep the mode setting's stored values, so no vault needs migrating and a
user who chose to be asked is still asked.

## Non-functional requirements

NFR1. One interaction per turn per note, whatever the number of edits.

NFR2. A parked choice settles on a cancelled turn, so the loop never stays
parked.

NFR3. A choice reaches the model as a tool result and never as an instruction,
so a note path cannot widen what the model may do.

NFR4. A vault with search disabled offers neither the choosing tool nor the
open, and its prompt is unchanged byte for byte.

NFR5. The picker is readable on a phone, where the drawer is narrow and the
paths are long.

## What the design must settle

- What the tool is called, given it is neither an approval nor a plain question.
- What the shortlist cap should be, given a glob returns fifty and a grep ten.
- How the picker renders a long path on a narrow drawer without truncating the
  part that distinguishes two candidates.
- Whether the mode setting's type is renamed with its wording, or left naming a
  confirmation it no longer describes.
