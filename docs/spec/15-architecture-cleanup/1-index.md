# Architecture Cleanup: Engine Sub-Packages

Splits the engine package into six sub-packages named for the concept each
holds. A pure move: no behaviour changes, and the 854 passing tests are the
proof.

The engine holds 37 files across two directories. The code readability rules
cap a directory at seven files and a package at ten. Both are well past that,
so related concepts are not visible from the file listing.

- [2-proposal.md](2-proposal.md) - the six sub-packages, what goes in each, and the open question
- [3-diagram.md](3-diagram.md) - how the sub-packages depend on each other
