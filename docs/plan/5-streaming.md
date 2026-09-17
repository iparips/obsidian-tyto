# D. Streaming, Built During Review

Ships as 1.1.0 into a plugin already listed. The goal is the specced
experience: a transcript that appears while you are still speaking, rather
than after you stop.

Two designs cover it.
[desktop-v1](../spec/1-upcoming/2026-09-14b-desktop-v1/1-index.md) holds the
realtime contracts, the audio pipeline, the second provider and review mode.
[mobile-v1](../spec/1-upcoming/2026-09-14c-mobile-v1/1-index.md) holds the
ephemeral-token auth a phone needs, since a raw key cannot ship to a WebView.

Steps 2 to 5 of
[desktop-v1/7-implementation-order.md](../spec/1-upcoming/2026-09-14b-desktop-v1/7-implementation-order.md)
are independent once the contracts land, so D2 to D5 can be reordered after D1.

- [ ] D1 Realtime contracts and widened settings (2 h)
- [ ] D2 Mistral realtime session and direct-key auth (3 h)
- [ ] D3 Downsampler and streaming transcriber (3 h)
- [ ] D4 Live partials in the panel (3 h)
- [ ] D5 OpenAI as the second provider (3 h)
- [ ] D6 Review mode: diff preview, accept and reject (3 h)

Design the capture layer with the mobile token path in mind, so D8 reuses it
rather than forking it.

### D7. Settings for the widened surface (2 h)

- [ ] Provider dropdown
- [ ] Both keys
- [ ] Language and microphone
- [ ] Review toggle
- [ ] Frontmatter language override

### D8. Ephemeral token auth (3 h)

- [ ] Mint a client token rather than shipping the key to the WebView
- [ ] Automatic fallback to batch when a mint fails

### D9. Exit test both surfaces, then tag 1.1.0 (3 h)

- [ ] Dictating mixed prose and structure feels live on the desktop
- [ ] A rejected edit leaves the note untouched
- [ ] The same passes on a phone, and a mint failure degrades to batch
- [ ] Tag 1.1.0

Latency target is under 5 seconds, and every error notice names the failing
step (NFR2, NFR5).
