---
created: 2026-09-11
updated: 2026-09-11
---

# Design: The Transcript Classes

How the classes that build a transcript fit together. Where the record lives and
how it reaches the panel is [3b-wiring.md](3b-wiring.md); what they write is
[3a-document-shape.md](3a-document-shape.md).

Two groups, split by what they hold. TranscriptBuilder and TranscriptRepository
carry session state. Everything under TranscriptDocument is pure, taking a
TranscriptSource and returning lines.

```mermaid
flowchart LR
    Builder["TranscriptBuilder [Session, new]<br/>Responsibility: gathers the panel entries and the recorded steps into one value at the click"]
    Store["TranscriptRepository [Session, new]<br/>Responsibility: records what each turn step sent, keeping a part only when its text is new"]
    Source["TranscriptSource [Session, new]<br/>Responsibility: carries everything one transcript is made of, so the document takes one argument"]

    Document["TranscriptDocument [Session, new]<br/>Responsibility: assembles the whole document from the three sections"]
    Metadata["TranscriptMetadata [Session, new]<br/>Responsibility: writes the opening table, never the API key"]
    Section["TranscriptTurnSection [Session, new]<br/>Responsibility: writes one conversation turn, its Setup and its turn steps"]
    Step["TranscriptTurnStep [Session, new]<br/>Responsibility: writes one turn step as request, response and harness"]
    Lines["TranscriptEntryLines [Session, new]<br/>Responsibility: renders the Entry union case by case, as the panel showed it"]
    Appendix["TranscriptAppendix [Session, new]<br/>Responsibility: writes each prompt part and skill body once, under its version"]

    Skills["LoadedSkills [Session, new]<br/>Responsibility: finds each skill body in the history, so the appendix cites it rather than inlining it"]
    Diff["TextDiff [Session, new]<br/>Responsibility: reduces a changed part to the lines that moved"]
    Turn["TranscriptTurn [Session, new]<br/>Responsibility: splits the entries into turns, since an utterance opens one"]

    Builder --> Store
    Builder --> Source
    Document --> Source
    Document --> Metadata
    Document --> Section
    Document --> Appendix
    Document --> Turn
    Document --> Skills
    Section --> Step
    Section --> Lines
    Step --> Lines
    Step --> Skills
    Appendix --> Diff
    Appendix --> Skills
```

Arrows: uses-relationship (client to supplier). Every writer reads
TranscriptSource, so those arrows are left out: drawn, they say nothing and
cross everything.

That split is what makes the format testable without a DOM or a model. Only
TranscriptBuilder reads the store, so every case in
[5-test-plan.md](5-test-plan.md) hands TranscriptSource a literal and asserts on
the string that comes back.
