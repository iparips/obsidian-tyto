# AGENTS.md Loading: Budget and Reporting

How the cap is applied, and how a dropped file reaches the user. Components are
named in [3-component-design.md](3-component-design.md).

## Applying the cap

The cap is on total characters, not files, since one long file costs what five
short ones do. Selection runs before prompt ordering: fill from the nearest
folder outward, stop once the next file would exceed the cap, and drop the
furthest (FR9). The surviving list is then reversed into prompt order (FR4).
Running the two in the other order would drop the nearest files, which are the
ones the user most meant to apply.

Set the cap at 40,000 characters, roughly 10,000 tokens. The edit model's
context window is at least 128k tokens, so a full chain costs under 8% of it,
and the note plus conversation history keep the rest.

That is far above what folder instructions realistically run to, which is a
paragraph or two per file. The cap is a safety rail against a pathological
vault, not a routine constraint, so it should almost never fire. Sizing it
tighter would trade a real limit on what a user may write for a saving the
context window does not need.

## Reporting a drop

A drop should be rare, which is why all three channels report it. A cap that
fires once a year is one whose behaviour nobody remembers, so a silent drop
would read as the plugin ignoring instructions rather than as a limit being hit.

The panel lists the folders that applied and says when the cap dropped a file
(FR10), which serves the user reading back over a session. A Notice catches the
user who is not looking at the panel (FR14). A console.debug line names every
dropped file and its folder, for the user working out why a rule stopped
applying (FR15).

The Notice fires once per resolved chain, listing the count, rather than once
per dropped file (FR16). A deep path over the cap would otherwise stack several
notices for one cause. Nothing here is an error: the turn runs on the chain that
fitted, and the panel's entry for the turn is unchanged (NFR5).

The two new channels reuse what the codebase has. `notify` is already an optional prop
on SessionPanel (Session), backed by Notice (Obsidian) in main.ts, and carries
the backgrounded-recording message today. Console lines take the [owl]
prefix SkillRepository (Skills) and Recorder (Capture) already use.

AgentsMdRepository (Agents, new) returns which files it dropped rather than
notifying itself. Logging stays at the top level, so the repository reports an
outcome and main.ts decides how to surface it.

Test outline: [6-testing-strategy.md](6-testing-strategy.md).
