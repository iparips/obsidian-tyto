# AGENTS.md Loading: Testing Strategy

Unit test outline for the components in [4-component-design.md](4-component-design.md).

Covered in the release's test pass, following the repo's unit test conventions.
FakeAdapter (Test Support) already backs SkillRepository tests and serves these
unchanged.

- AncestorFolders (Agents, new): a root note, a nested note, and a note whose
  folder names contain spaces.
- AgentsMdRepository (Agents, new): no files, one at root, one at each level, an
  unreadable file mid-chain, and a chain exceeding the cap.
- Filename fallback: a folder with only AGENTS.md, one with only CLAUDE.md, one
  with both taking AGENTS.md alone, and a chain mixing the two across folders.
- Empty files: a whitespace-only file contributes no section, and an empty
  AGENTS.md still suppresses the folder's CLAUDE.md.
- Cache: a second target in the same folder reads nothing, a target in a
  sibling folder reads again.
- Cap reporting: a chain under the cap notifies nothing and logs nothing, a
  chain over it notifies once and logs every dropped file.
- PromptBuilder (Engine): empty chain omits the section, one file renders with
  its folder label, several render root first, and the section states that
  later entries win.
- Rebinding to a note in another folder resolves that folder's chain.
