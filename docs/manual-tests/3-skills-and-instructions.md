# Skills and Instructions

The harness makes the model answer the skill question before it writes. It never
decides which skill fits, so these scenarios separate what is enforced from what
is judgement.

## SK1. A matching skill loads before the edit

Setup: a vault skill whose description names what you are about to ask for.

1. Ask for something that skill covers.

Check: the steps list holds Loaded skill before the edit, and its workflow was
followed rather than improvised.

## SK2. A command does not replace the skill

The failure this came from: a command opened the right note, the edit landed,
and the skill's own steps were skipped.

1. Ask for something a skill covers and a command reaches, such as adding an
   item to a list the command opens.

Check: Loaded skill appears, and it appears before Ran command.

## SK3. A skill loads once

1. Run SK1.

Check: Loaded skill appears once. A second load of the same skill is refused,
so two identical entries are a regression.

## SK4. Loading answers the question

1. Run SK1.

Check: No skill applies does not appear. A turn that loaded a skill has already
answered, and both entries together is a contradiction.

## SK5. A decline says why

Setup: an instruction no skill covers.

1. Dictate a plain line into an open note.

Check: the steps list holds No skill applies with a reason naming what the
skills cover that this is not. The reason must not restate your instruction.

## SK6. No skill means no edit until it is answered

This is the enforced half, and the one an automated evaluation can assert.

1. Watch any turn in a vault with skills.

Check: no Edit step appears before either Loaded skill or No skill applies.

## SK7. A vault with no skills is unaffected

Setup: the skills folder empty or the setting blank.

1. Dictate a line into an open note.

Check: the edit lands with no skill step, and no skill tool is offered.

## SK8. Instructions are numbered with the rest

1. Edit a note under a folder holding an AGENTS.md.

Check: Loaded agent instructions appears in the numbered list, in the position
it happened, rather than as a line beside it.

## SK9. Judgement, not enforcement

A skill saying it MUST load for a kind of file has been declined for a file of
that kind. Run SK1 several times across sessions and count how often the right
skill loads. This is the case an evaluation should measure as a rate rather
than assert once.
