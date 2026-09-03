# Finding Notes

A glob matches notes and never folders, and a * never crosses a /. Most of these
scenarios are cases where the model guessed structure rather than searching for
the file.

## FN1. The first glob lists rather than guesses

1. Ask for a note by a date, in a vault whose filenames you have not shown the
   model.

Check: the first Globbed step ends in /* or names the file with a wildcard on
both sides. It must not spell out a filename the model has not seen.

## FN2. A date is not spelled out

The failure this came from: the vault writes 08-28, the model globbed 28-08,
matched nothing, and retried the same shape with the parts reordered.

1. Ask for a note by a date.

Check: no glob spells a full date-shaped filename before a listing has returned
one. A glob that matched nothing is followed by a wider pattern, not a
reordered one.

## FN3. A known name is matched directly

1. Ask for a note whose date you have named explicitly.

Check: the model globs for the file, such as a pattern wrapping the date in
wildcards, rather than walking folder levels to find where it lives.

## FN4. A folder pattern is told why it matched nothing

1. Watch a turn glob a pattern whose last segment names a folder.

Check: the result says a glob matches notes rather than folders, and says to
end the pattern with /* or use **. A bare "no notes match" is a regression.

## FN5. Two globs are enough

The failure this came from: five globs, two of them over archived folders from
another quarter, then a question to the user.

1. Ask for a note by a date.

Check: the turn reaches a candidate within two globs that returned notes. More
than that means it is guessing rather than reading what it already has.

## FN6. Archived notes are not mistaken for current ones

Setup: a vault with an archive folder holding notes named like current ones.

1. Ask for a recent dated note.

Check: the note offered is the current one. An archived note of a similar name
being offered is the failure this exists to catch.

## FN7. Structure is not asked about

1. Ask for a note by a relative date, such as last Thursday.

Check: the model does not ask which folder holds it or which week the date
falls in. It may ask which of two real dates you meant, which is a different
question and a legitimate one.

## FN8. A path no search returned is refused

1. Watch any turn that opens a note.

Check: an open of a path no search returned is refused naming the search, and
that refusal is distinct from one naming the choosing tool.
