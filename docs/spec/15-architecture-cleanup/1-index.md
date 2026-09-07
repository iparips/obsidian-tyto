# Architecture Cleanup: Engine Sub-Packages

Splits the engine package into six sub-packages named for the concept each
holds. A pure move, shipped in f7a9ae8: no behaviour changed, and the passing
suite was the proof.

The engine held 37 files across two directories. The code readability rules cap
a directory at seven files and a package at ten. Both were well past that, so
related concepts were not visible from the file listing.

- [2-proposal.md](2-proposal.md) - the six sub-packages, what goes in each, and what decides a tool
- [3-diagram.md](3-diagram.md) - how the sub-packages depend on each other
- [4-choice-subsystem.md](4-choice-subsystem.md) - how a shortlist becomes a pick, and why it is checked twice
- [5-note-opened-by-command.md](5-note-opened-by-command.md) - what a command run records, and who reacts to it
