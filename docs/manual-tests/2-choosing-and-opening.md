# Choosing and Opening

The pick is both which note and permission to write to it, so these scenarios
check that nothing opens or edits without one.

## CO1. The model offers, the user picks

Setup: several notes match a description, none of them open.

1. Ask for an edit to a note by a description matching several.
2. Confirm the panel lists every candidate as its own row, each a full
   vault-root path.
3. Pick one.

Check: the steps list reads Offered, then Opened naming the pick, then Edit.
The edit is in the note you picked and in no other.

## CO2. An open needs a pick, even for one candidate

Setup: a description matching exactly one note.

1. Ask for an edit to it.

Check: you are still offered the single candidate as a row. The turn does not
open it on the model's own judgement.

## CO3. A decline opens nothing

1. Run CO1 and decline every candidate.

Check: no note opens, no note changes, and the panel records the declined
shortlist rather than dropping it. The model asks what you meant rather than
running the same search again.

## CO4. A decline keeps the turn's open

1. Decline a shortlist, then let the model offer a second one.
2. Pick from the second.

Check: the note opens. Declining spent nothing.

## CO5. One question per note per turn

1. Ask for two edits to the same note in one instruction.

Check: you are asked once. The steps list holds one Offered and one Opened.

## CO6. A second turn asks again

1. Run CO1 and let it complete.
2. In a new turn, name the same note again.

Check: you are offered it again. Consent does not carry across turns.

## CO7. A found note reopens without a new search

1. Run CO1 and let it complete.
2. In a new turn, ask for the same note.

Check: no glob or grep step is needed to reach it. Finding is per session.

## CO8. An edit needs an open, not just a pick

This is the false-success case: the panel once said an edit applied while the
file never changed.

1. Watch a turn that searches, then picks, then edits.

Check: the steps list holds Opened between Offered and Edit. If Edit appears
without Opened, the edit did not land and the reply is wrong.

## CO9. The note the turn started on stays editable

Setup: a note open, no searching in the instruction.

1. Dictate a line into it.

Check: the edit lands with no choosing step. Plain dictation is untouched by
the choosing gate.

## CO10. Auto mode opens without asking

Setup: the mode setting turned off, so Owl does not ask which note.

1. Run CO1.

Check: nothing asks, and the model opens what it found.

## CO11. Mobile

1. Run CO1 in the mobile drawer.

Check: every candidate path is readable and wraps rather than truncating. The
turn completes.
