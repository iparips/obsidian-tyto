---
created: 2026-09-11
updated: 2026-09-11
---

# Disclosure Gaps

The policies allow network use, a required account, and access to user content
only where the README says so plainly. Owl does all three and the README says
none of it.

## 2. Network use is not disclosed

Every turn sends note text and the spoken instruction to Mistral. The README
mentions "Mistral only, using your own API key" under what the plugin does not
do, which is a capability note rather than a disclosure.

- Rule: "Network use. Clearly explain which remote services are used and why
  they're needed." (Developer policies, Disclosures)
- Evidence: MistralProvider (Tyto) holds the API base
  `https://api.mistral.ai/v1`, sending audio to `/audio/transcriptions` and
  note content to `/chat/completions`.
- Fix: a named section in the README saying which service, which endpoints,
  what leaves the vault, and why.

## 3. The account requirement is not disclosed

Owl does nothing without a Mistral API key. A user installing it from the
directory learns this only when a turn fails.

- Rule: "An account is required for full access." (Developer policies,
  Disclosures)
- Evidence: DEFAULT_SETTINGS ships an empty `mistralApiKey`
  (src/settings/settings.ts).

## 4. The transcript's reach is not disclosed

The copy-transcript feature puts note text and vault instructions on the
clipboard. The settings note says so, the README does not. The feature is off
by default, which is the right default and does not remove the need to say it.

- Evidence: PanelHeader (Tyto) writes the transcript to the clipboard with
  `navigator.clipboard.writeText`, and HistoryEntry (Tyto) does the same for one
  entry. The transcript is built from the whole session.
