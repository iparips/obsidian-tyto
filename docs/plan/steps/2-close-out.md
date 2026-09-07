# A. Close out what is built

Code is ahead of the manual tests. That gap gets more expensive the longer it
sits, because the next feature gets designed against a document that no longer
matches what has been proven to work.

### A1. Reconcile the finding-notes spec with the code (1 h)

- [x] Mark both finding-notes index files built
- [x] Mark the twelve steps in its implementation order
- [x] Mark the superseded search flow in the harness spec

### A2. Run the exit tests for features 10 and 14 (2 h)

Record failures as manual-test scenarios rather than fixing them. Fixing while
testing loses the list.

- [ ] Feature 10, both exit tests, against a real vault
- [ ] Feature 14, both exit tests, against a real vault
- [ ] Write up each failure as a scenario

### A3. Fix what those exit tests find (3 h)

- [ ] Fix the failures A2 recorded
- [ ] Re-run the scenarios that failed

### A4. Run the outstanding exit tests for features 6, 8, 9 (2 h)

- [ ] Feature 6, the panel exit test
- [ ] Feature 8, cancelling a turn
- [ ] Feature 9, model-chosen targets
