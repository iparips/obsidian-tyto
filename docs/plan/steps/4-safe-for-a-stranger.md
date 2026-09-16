# C. Make it safe for a stranger

Everything here exists because someone who is not the author will install this.
A stranger has no API key, no allow-list, and no patience for an edit landing in
the wrong note.

### C1. First-run onboarding when no API key is set (3 h)

- [ ] Say what is missing and where to put it
- [ ] Leave no surface stuck pending without a key

### C2. Harden every error path (3 h)

Each produces a panel entry naming the failing step, and none leaves the panel
stuck pending (NFR5).

- [ ] A bad key
- [ ] A network drop
- [ ] A rate limit
- [ ] A malformed tool call

### C3. Audit against the plugin review guidelines (2 h)

Covered by step 2 of
[mobile-v1/4-release-checklist.md](../../spec/1-upcoming/2026-09-14c-mobile-v1/4-release-checklist.md).

- [ ] No innerHTML
- [ ] Async onload
- [ ] No global style leakage
- [ ] A detach that cleans up every listener

### C4. Public README and privacy statement (2 h)

Covered by step 5 of the same checklist.

- [ ] README a stranger can follow
- [ ] Privacy statement saying where the audio goes

### C5. Demo clip and screenshots, both surfaces (2 h)

- [ ] Desktop clip
- [ ] Mobile clip
- [ ] Screenshots for the listing

## Submission

Submit at the end of C, thirteen sittings in. The loop works, it works on a
phone, it survives being backgrounded, it fails legibly, and it says where the
audio goes. That is enough.

- [ ] Tag 1.0.0 with one provider and no streaming
- [ ] Submit to the community store

A second provider doubles the surface to keep working while learning what real
users break. Review takes weeks and is outside your control, so milestone D is
what to build during it.
