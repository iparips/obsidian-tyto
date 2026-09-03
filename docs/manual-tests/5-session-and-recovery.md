# Session and Recovery

What a session binds to, and what survives a turn that fails. Every scenario
here came from a session that stranded itself.

## SR1. A non-markdown file does not bind the session

The failure this came from: clicking a Bases file bound the session to it, and
every later turn failed with "not open in an editor".

1. With a session running, open a .base file, a canvas or a PDF.
2. Ask for an edit.

Check: the header still names the markdown note, and the edit lands there.

## SR2. A stranded session says how to recover

Setup: a session bound to a non-markdown path, if you can still reach that
state.

1. Ask for an edit.

Check: the error says the path is not a markdown note and names Reset. An error
saying only "not open in an editor" is a regression, since opening it never
helps.

## SR3. A failed turn keeps its instruction

The failure this came from: a turn that could not open dropped the utterance,
so a following "retry" retried the instruction before it.

1. Put the session in a state where a turn fails to open.
2. Ask for something specific.
3. Fix the state, then say "retry".

Check: the model retries what you asked in step 2, not an earlier instruction.

## SR4. A command moving the target costs no second question

1. Ask for an edit to a note the model must find, in an instruction that also
   runs a command opening a different note.

Check: you are asked once. Returning to the chosen note needs no second pick.

## SR5. A cancel settles a parked choice

1. Start a turn that offers a shortlist.
2. Cancel while the list is on screen.

Check: the turn ends, nothing opens, and the panel records the entry as settled
rather than leaving live rows behind.

## SR6. A cancelled turn says what it wrote

1. Cancel a turn after an edit has landed.

Check: the panel names the note that changed. Nothing is reverted, so the reply
has to say where to look.

## SR7. A turn that runs out says where the steps went

1. Give an instruction broad enough to exhaust the step budget.

Check: the failure names the budget, and the numbered steps list shows what was
spent. The list is the record, so the message does not repeat it.

## SR8. The panel closed still reaches you

1. With the panel closed, run a turn that offers a shortlist.

Check: a notice says the turn wants you, and opening the panel shows the live
list.
