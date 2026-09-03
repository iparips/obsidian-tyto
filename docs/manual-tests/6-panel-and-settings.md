# Panel and Settings

What the panel reports, and what the settings reach. A panel that misreports a
turn is the same class of fault as one that does the wrong thing.

## PS1. Every step is numbered in order

1. Run a turn that loads instructions, loads a skill, runs a command and edits.

Check: all four appear in one numbered list, in the order they happened. An
entry sitting beside the list rather than in it is a regression, since that is
what once made a skill loaded before an edit read as though it came after.

## PS2. The labels name what happened

Check the labels read: Loaded agent instructions, Loaded skill, Ran command,
Globbed, Grepped, Read, Offered, Opened, Edit, Refused, No skill applies.

## PS3. A refusal says why

1. Watch any turn that refuses a call.

Check: the refusal appears as a step with its reason, so a turn that went
nowhere still says what stopped it.

## PS4. A suggestion click answers

The failure this came from: clicking a suggested answer filled the input box
and waited for you to press send.

1. Ask something that makes the model ask you a question with suggestions.
2. Click one.

Check: the turn continues immediately. The input box is empty and you pressed
send nothing.

## PS5. The picker adds the id it shows

1. In settings, search for a command and add it.

Check: the entry added matches the id shown under the name in the picker row,
exactly. Some ids carry a colon and some do not.

## PS6. A command is called by its id

The failure this came from: the model sent the whole prompt line, name and all,
where the id belonged.

1. Ask for something a listed command opens.

Check: the command runs. A refusal naming a command id with a dash and a name
in it means the model sent the line rather than the id.

## PS7. A refused command names what is allowed

1. Watch a turn refuse a command id.

Check: the refusal lists the ids the vault does allow, so the model can correct
itself rather than concluding the command is unavailable.

## PS8. The mode setting keeps its stored values

1. Toggle "Ask which note Owl should open" off and on.

Check: the vault's data.json still holds 'confirm' and 'auto'. No vault needs
migrating.

## PS9. Search off removes the tools

Setup: the search setting turned off.

1. Ask for a note the model would have to find.

Check: the model says it cannot reach the destination. The searching and
choosing tools are absent rather than refusing.

## PS10. An existing heading is used

The failure this came from: the note held "Father's Day Breakfast" and the
model added a second "Fathers Day" heading beneath it.

1. Ask to add something under a heading, naming it loosely: different case, a
   missing apostrophe, or fewer words than the note has.

Check: the content lands under the heading already there. A second heading
meaning the same thing is the regression.
