# Oversized Files

Eight files exceed the readability limits, but only four are worth changing.
Size alone does not separate them: the largest file in the codebase holds two
functions, and the worst function sits in a file that passes the line count.

Measured against the code readability rules: 120 lines per file, 20 lines per
function, one level of branching.

- [2-findings.md](2-findings.md) - what was measured, and which files earn a change
- [3-candidates.md](3-candidates.md) - the four worth refactoring, with what each would become
