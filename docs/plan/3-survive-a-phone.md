# B. Survive A Phone

Mobile is the case the plugin is designed around, and it is the surface with
the least evidence behind it. Every scenario in
[manual-tests](../manual-tests/1-index.md) was written from a real failure,
and most were found on the desktop.

Session persistence is built. It shipped as
[session-persistence](../spec/3-archived/2026-09-07c-session-persistence/1-index.md),
with three follow-ups on what a restored session binds to. What is untested is
whether the rest of the plugin holds up on a phone.

### B1. Run the whole manual-test folder on a phone (3 h)

All five scenario files, on the mobile drawer. Press Reset between scenarios:
a session carries its binding and its chat history across turns, and several
faults were only visible because an earlier turn left something behind.

- [ ] Choosing and opening
- [ ] Skills and instructions
- [ ] Finding notes
- [ ] Session and recovery, including a backgrounded app
- [ ] Panel and settings

### B2. Fix the mobile failures (3 h)

- [ ] Fix what B1 found
- [ ] Re-run the failing scenarios
