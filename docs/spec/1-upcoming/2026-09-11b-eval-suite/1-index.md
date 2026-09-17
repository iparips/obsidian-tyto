---
created: 2026-09-11
updated: 2026-09-11
---

# Eval Suite: Spec

Guards the model's judgement. A prompt change is a behaviour change, and
[AGENTS.md](../../../../AGENTS.md) already says the unit tests cannot catch a
regression in one. Its answer today is to test by hand against a real vault and
a real key, which runs when someone remembers and records nothing.

- [2-requirements.md](2-requirements.md) - what regresses, what must be asserted, and what stays out
- [3-design.md](3-design.md) - the runner, the recording provider, and the assertion vocabulary
- [4-tasks.md](4-tasks.md) - build order in five commits, and the starter case set

The suite runs the real engine against the real provider over an in-memory
vault. Nothing in src changes: anEngine in test-support already takes any
ChatProvider, so the eval passes the real one where a unit test passes a mock.

Two facts shape it. Fourteen tools reach the model and only three of them write,
so most of what can regress is a routing decision rather than an edit. And the
tool descriptions spend their words on ordering rules, such as resolve_date
before any glob and choose_note before open_note, none of which shows up in a
note's final content.

So the suite asserts trajectory first and vault state second. It records the
tool calls the model made, in order, and checks those alongside the note. A
third family asserts restraint: that an unmentioned section is untouched, which
is what catches a model doing what was asked plus something extra.

The cases are data. One YAML file holds the vault, the utterance, the
assertions, and a run count with a threshold, because one failure of a sampled
behaviour is not a regression.

Thresholds are measured before they are written down. A case is run about ten
times first, and one sitting near 60 percent is a prompt bug rather than a
threshold to lower. That rule is what keeps the suite worth reading.

It runs nightly and on pull requests touching the prompt, never on every push.
The repo has no CI at all today, so unit CI is the first commit.
