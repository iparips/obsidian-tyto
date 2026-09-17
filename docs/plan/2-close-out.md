# A. Close Out What Is Built

Code is ahead of the manual tests. That gap gets more expensive the longer it
sits, because the next feature gets designed against a document that no longer
matches what has been proven to work.

Two specs are also mid-flight in [spec/2-active](../spec/2-active), and the
suite does not go green until the first of them lands.

### A1. Finish naming what a turn touched (3 h)

Follows the three commits in
[naming-what-a-turn-touched/8-tasks.md](../spec/2-active/2026-09-17-naming-what-a-turn-touched/8-tasks.md).
Five tests fail in the tree until it is done.

- [ ] A progress line names the note it acted on
- [ ] The panel stops narrating the user's own note switches
- [ ] A vault write says it took the vault path
- [ ] Run the three acceptance checks against a real vault

### A2. Lighten the architecture docs (3 h)

Follows [lightening-the-architecture-docs/7-tasks.md](../spec/2-active/2026-09-17a-lightening-the-architecture-docs/7-tasks.md).
The design is written and the seven subsystem files exist; what remains is the
working tree's unfinished edits.

- [ ] Land the changes still uncommitted
- [ ] Run the four acceptance checks, including the scriptable one

### A3. Run the exit tests for features 10 and 14 (2 h)

Record failures as manual-test scenarios rather than fixing them. Fixing while
testing loses the list.

- [ ] Feature 10, both exit tests, against a real vault
- [ ] Feature 14, both exit tests, against a real vault
- [ ] Write up each failure as a scenario

### A4. Fix what those exit tests find (3 h)

- [ ] Fix the failures A3 recorded
- [ ] Re-run the scenarios that failed

### A5. Run the outstanding exit tests for features 6, 8, 9 (2 h)

- [ ] Feature 6, the panel exit test
- [ ] Feature 8, cancelling a turn
- [ ] Feature 9, model-chosen targets
