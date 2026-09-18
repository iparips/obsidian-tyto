---
created: 2026-09-18
updated: 2026-09-18
---

# The Manual Review Request

What to send the directory's reviewers. The block below gets pasted whole, so it repeats what the rest of this spec establishes rather than linking to it: the reader is a reviewer with no access to the repository's docs.

Under a thousand characters, which is what the field takes. That bought the two errors their evidence and cost the warnings theirs, which is the right trade: a warning does not gate a listing, so leaving one unanswered costs nothing, and the closing line invites the question if a reviewer wants it.

Each error says what was checked rather than asserting a verdict, since a reviewer can only take a claim on trust if the working is shown. The unsafe call ends in a question on purpose: an answer naming something real about how the types resolve is worth more than a reviewer told they are wrong.

Against the scan of 0.5.1, commit ebb0f81. Check the review has finished before sending, since that result said more checks were still running.

## What Is Left Out, and What to Say if Asked

The five warnings, each already settled in [2-requirements.md](2-requirements.md):

- TFile and TFolder casts: every site is in src/test-support, which the bundle does not contain.
- vitest advisory: a dev dependency, and vite arrives through it.
- fetch over requestUrl: RequestUrlParam carries no AbortSignal, and the signal is what makes cancelling a turn stop the request. api.mistral.ai answers a preflight with access-control-allow-origin *, so the CORS the rule guards against is not in play.
- this: void, eighteen sites: static methods passed to map, which cannot capture an unintended this.
- :has at styles.css:152: it styles a rendered-markdown entry over a handful of panel rows.

```text
Requesting manual review. Two errors block the listing; both look like false positives.

1. "Code creates script elements at runtime" - not my code. createElement('script') appears nowhere in my source. The sites are React DOM's resource-preloading path, never reached: I call neither preinit nor preloadModule. It cannot be tree-shaken, since React assigns preinitScript onto a shared dispatcher, so no bundler can prove it dead. Production mode already removed two of the three sites. This should affect every React plugin you list.

2. "Unsafe call to TranscriptDocument.write" - does not reproduce. Every type on that line is declared, and the compiler resolves argument 0 to TranscriptSource, not any. My lint passes it, and strictTypeChecked with no-unsafe-argument forced on reports nothing. What did your rule resolve it to? If any, the difference is in type resolution, not the code.

The warnings are in code that does not ship or is deliberate; happy to detail any.
```
