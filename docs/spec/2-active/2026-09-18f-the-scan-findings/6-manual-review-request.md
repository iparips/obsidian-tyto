---
created: 2026-09-18
updated: 2026-09-18
---

# The Manual Review Request

What to send the directory's reviewers, and why each point is worth their time. The block below gets pasted whole, so it repeats what the rest of this spec establishes rather than linking to it: the reader is a reviewer with no access to the repository's docs.

Ordered by what blocks the listing. The two errors lead, because a warning does not gate a listing and an error does. Each point says what was checked rather than asserting a verdict, since a reviewer can only take the claim on trust if the working is shown.

Point 2 is phrased as a question rather than a rebuttal on purpose. If the answer names something real about how the types are exported, that is worth knowing; a reviewer told they are wrong has nowhere to go with it.

Against the scan of 0.5.1, commit ebb0f81. Check the review has finished before sending: the 0.5.1 result said more checks were still running, and a finding that resolves itself is one not worth writing about.

```text
Subject: Manual review request - Tyto (0.5.1)

Two errors are blocking the listing. Both are, I believe, false positives,
and neither corresponds to code I can change. The remaining findings are
warnings in code that is not shipped. Details below, in the order I think
matters.

1. "Code creates script elements at runtime" (Error) - not my code

createElement('script') appears nowhere in my source. The sites are in
React DOM's resource-preloading path, which arrives through
react-dom/client and is never reached: Tyto calls neither preinit nor
preloadModule, and never renders a <link> or <script> element.

It cannot be tree-shaken out. React assigns preinitScript as a property on
a shared dispatcher object, so no bundler can prove it unreachable. I did
reduce it: building React in production mode removed two of the three
sites and cut the bundle from 1.36 MB to 410 KB. The last one is
structural.

This should affect every React-based plugin in the directory, so I suspect
you have seen it before.

2. "Unsafe call to TranscriptDocument.write for argument 0" (Error) - does
not reproduce

Every type on that line is declared. transcriptOf is
(entries: readonly PanelItem[]) => TranscriptSource; TranscriptDocument.write
takes a TranscriptSource; that class has seven readonly properties and no
any. I forced the compiler to print the resolved argument type and it is
TranscriptSource.

My own lint passes the file, and no-unsafe-argument is disabled only under
**/tests/** and src/test-support/**. Running strictTypeChecked with the
rule forced on reports nothing there either.

The usual cause of this rule misfiring is the linter running without
resolvable type information, where imports degrade to any. Could you tell
me what your rule resolved argument 0 to? If it is any, the difference is
in type resolution rather than in the code, and I would rather not widen
an already-concrete type to silence it.

3. TFile / TFolder casts (Warnings) - test-only code

All seven sites are in src/test-support/, which the bundle does not
contain - the string test-support appears in main.js zero times. They are
test doubles, where an instanceof check against a real TFile cannot apply.

4. vite / vitest advisory (Warning) - dev dependency

vitest is a dev dependency and vite arrives through it. Neither is in the
shipped bundle; the advisory describes the test runner.

5. fetch instead of requestUrl (Warning) - deliberate, and documented

RequestUrlParam carries no AbortSignal, and the signal is what makes
cancelling a turn actually stop the request rather than wait for the model
to finish. The CORS that requestUrl exists to bypass is not in play:
api.mistral.ai answers a preflight with access-control-allow-origin: *.
The reasoning is recorded beside the call and in eslint.config.mjs, where
the rule is disabled for that one file.

6. this: void warnings (18 sites)

These are static methods passed to map. I already moved the port and props
callbacks to properties when I adopted eslint-plugin-obsidianmd; what
remains cannot capture an unintended this.

7. :has selector (Warning) - deliberate

It styles a rendered-markdown entry. The alternative is a class the
Obsidian renderer would have to set. It applies to a handful of panel
rows, not the broad invalidation the warning describes.

Also addressed since the first scan: the description no longer contains
"Obsidian", and the bundler version is now pinned in CI so a release
rebuilds reproducibly.
```
