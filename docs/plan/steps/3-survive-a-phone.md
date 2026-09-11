# B. Survive a phone

Mobile is the case the plugin is designed around. A session that vanishes when
the app backgrounds is the first bug a reviewer hits.

B1 and B2 follow the two commits in
[session-persistence/5-implementation-order.md](../../spec/22-session-persistence/5-implementation-order.md).

### B1. Session persistence: serialise and restore (3 h)

- [ ] Serialise the session
- [ ] Restore it when the WebView comes back

### B2. Session persistence: interrupted turns and reset (2 h)

- [ ] Handle a turn interrupted by eviction
- [ ] Reset onto the note in front of the user

### B3. Run the whole manual-test folder on a phone (3 h)

- [ ] All six manual-test files, on the mobile drawer

### B4. Fix the mobile failures (3 h)

- [ ] Fix what B3 found
- [ ] Re-run the failing scenarios
