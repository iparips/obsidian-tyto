---
created: 2026-09-16
updated: 2026-09-16
---

# What Went Wrong

How the reported session produced the state it did, read off the transcript in
a session transcript (removed: held personal vault content). Kept apart from the requirements because
it explains the defect rather than stating what is built.

## The Retarget

The user opened the shopping list while a turn was archiving the todo list.
ConversationTurnRunner.retargetTo swapped the note the running turn wrote to,
and note context v4 in the transcript is that moment: the path changes from
todo.md to shopping-list.md with nothing in the conversation saying why.

The three turns after it are the model working from a true statement it could
not explain. It said the open note was the shopping list, which it was, and had
no way to say how a todo instruction had ended up there.

## The Stale Anchors

The model sent five replace_text calls computed from one snapshot. They apply in
order, each against the note the one before it changed.

| Call | Anchor computed from | Note when it applied     | Outcome |
| ---- | -------------------- | ------------------------ | ------- |
| 1    | The turn's snapshot  | Unchanged                | Applied |
| 2    | The same snapshot    | Shifted by call 1        | Applied |
| 3    | The same snapshot    | Shifted by calls 1 and 2 | Refused |
| 4    | The same snapshot    | Shifted by 1 and 2       | Applied |
| 5    | The same snapshot    | Shifted by 1, 2 and 4    | Applied |

The repair attempts then duplicated the Today items and left the Admin items
twice under Archived. The batch is what the system prompt asks for; what it does
not say is that an anchor is stale the moment a sibling call lands.

Archived spec 33 raised this as D4 and left it open, on the grounds that the
case was narrower than the one reported. This session is that case, and it cost
the user's todo file.
