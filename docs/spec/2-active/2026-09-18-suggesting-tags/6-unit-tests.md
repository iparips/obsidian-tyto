---
created: 2026-09-18
updated: 2026-09-18
---

# Unit Tests

The plan for [5-design-listing-the-vaults-tags.md](5-design-listing-the-vaults-tags.md). Whether a suggested tag is a good tag is a judgement no unit test makes, so that stays in [4-acceptance-criteria.md](4-acceptance-criteria.md).

## Test support comes first

None of this runs against the fakes as they stand, so the support work is the first commit.

- src/test-support/__mocks__/obsidian.ts declares no MetadataCache, no CachedMetadata, no TagCache and no getAllTags. It gains a CachedMetadata interface carrying optional tags and frontmatter, a MetadataCache interface with getFileCache, and a getAllTags function combining the two the way Obsidian's does: a leading hash on every tag, frontmatter entries hashed on the way out.
- FakeVault (Test Support) gains withTags(path, tags), recording a note's tags beside its content, and asMetadataCache(), answering a getFileCache built from them. Tags are given hashed or bare, so a test can state a frontmatter list as the vault writes it.
- FakeVault.withNote leaves a note with no tags answering a cache entry with none, not null, since a note Obsidian has indexed and found nothing in is the common case.

A null cache entry is its own case and TagReader must survive it, so the fake answers null for a path it holds no note for.

## TagReader.findTags

```text
tally = {}
for file in vault.getMarkdownFiles():
  cache = metadataCache.getFileCache(file)
  if cache is null: continue
  for tag in unique(getAllTags(cache) or []):
    tally[tag] += 1
rows = tally sorted by count descending, then tag ascending
if filter: rows = rows where tag contains filter, case-insensitively
return TagListResult(rows capped at MAX_TAG_RESULTS, rows.length)
```

```text
notes carry tags
  returns each tag with the number of notes carrying it
  counts a tag once for a note carrying it several times
  counts a frontmatter tag and an inline tag as one tag
  returns a nested tag as its own row
  leaves a nested tag out of its parent's count
  orders the rows by count, most-used first
  orders equally used tags by name, so the order is stable
  reads no note contents, so a listing costs no read
  says nothing was trimmed when the rows fit
a filter is given
  returns only the tags whose name contains the filter
  matches the filter without regard to case
  counts a filtered tag across the whole vault, not the filtered set
  returns nothing when no tag contains the filter
  counts the filtered rows as the total, so the trimmed line reads against them
the vault has no tags
  returns no rows
  counts nothing as the total
a note has no cache entry
  skips it rather than failing
  still counts the tags of the notes around it
more tags than the cap
  caps the rows at MAX_TAG_RESULTS
  says the cap trimmed the rows when it did
  counts every matching tag as the total
  keeps the most-used tags, since the cap follows the sort
```

## TagReport.buildReport

```text
if result.total == 0:
  return filter ? noTagContains(filter) : "this vault uses no tags"
rows = result.tags mapped to "<tag> - <count> notes"
return rows + trimmedLine(rows.length, result)
```

```text
tags come back
  lists each tag with its note count
  writes a count of one as one note, so the row reads
  adds no trimmed line when the rows fit
  names the shown count and the total when the cap trimmed the rows
  tells the model to narrow with the filter rather than with a pattern
nothing comes back
  says the vault uses no tags when no filter was given
  names the filter that matched nothing when one was given
  tells the model to call again without a filter, so it widens rather than narrows
```

The two empty messages are the case worth splitting: told only that nothing matched, the model retries narrower filters, which is the failure SearchReport.noGlobMatch (Search) exists to prevent for globs.

## SearchToolsService.listTags

```text
filter = call.optionalArgument("filter") ?? null
result = tagReader.findTags(filter)
return TextResult(TagReport.buildReport(filter, result), ProgressLine.listedTags(filter, result.total))
```

```text
the model calls the tool
  answers the report text as the result
  publishes a progress line naming the tag count
  names the filter on the progress line when one was given
  records no path, so nothing it returned becomes openable
  passes no filter to the index when the model sent none
```

The fourth leaf is the one guarding D4. It asserts that TurnState.pathsReturnedByVault is untouched, which is what keeps a vocabulary tool out of the write path.

## HarnessToolsService.execute

```text
searching is on
  dispatches a list_tags call to the search tools service
  does not dispatch it to the note paths shortlist
searching is off
  refuses a list_tags call with the reason
  reaches the tag index not at all
```

The second leaf of the first case is the fallthrough guard: execute ends by calling NotePathsShortlistTool.offerPaths (Engine Tools), so a branch left out sends the call there silently.

## ToolCatalogue.forCapabilities

Added to the existing tool-catalogue.test.ts, which today covers only the skills argument. The gating cases are new to that file.

```text
searching is on
  offers list_tags
searching is off
  omits list_tags, as it omits the other search tools
the vault defines skills
  leaves list_tags without applicable_skills, since it reaches no path
```

## SystemPrompt.build

Added to the existing system-prompt.test.ts, under its search-enabled describe.

```text
search is enabled
  tells the model to list the vault's tags before suggesting one
  tells the model to suggest only tags the list returned
search is disabled
  says nothing about tags
  still produces the release 3 prompt, unchanged
```

The last leaf is the existing fixture assertion. It is named here because the requirements expect it to move, and it does not.
