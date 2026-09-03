// Every field a caller can offer. modified and matches are optional, so a glob
// declares no match count and a caller that omits a key the order asks for
// falls back to path.
export interface SortKeys<T> {
  path(item: T): string
  modified?(item: T): number
  matches?(item: T): number
}

type SortField = 'path' | 'modified' | 'matches'

const ASCENDING_BY_DEFAULT: SortField[] = ['path']

// A value, so both searchers sort through one comparator rather than each
// growing a switch. The direction defaults per field: ascending is right for a
// path and wrong for a date (FR12).
export class ResultOrder {
  private constructor(
    private readonly field: SortField,
    private readonly ascending: boolean,
  ) {}

  static of(sort?: string, order?: string): ResultOrder {
    const field = ResultOrder.fieldOf(sort)
    return new ResultOrder(field, ResultOrder.ascendingOf(field, order))
  }

  // An unrecognised field falls back to path: the field is the model's, the set
  // is small, and a turn should not end because it asked for an ordering that
  // does not exist.
  private static fieldOf(sort?: string): SortField {
    if (sort === 'modified' || sort === 'matches') return sort
    return 'path'
  }

  private static ascendingOf(field: SortField, order?: string): boolean {
    if (order === 'ascending') return true
    if (order === 'descending') return false
    return ASCENDING_BY_DEFAULT.includes(field)
  }

  // The caller supplies one key per field it supports, and the value picks the
  // one its field names. A searcher therefore states what it can sort by
  // without branching on which was asked for.
  sorted<T>(items: readonly T[], keys: SortKeys<T>): T[] {
    const compare = this.comparatorOf(keys)
    return [...items].sort((left, right) =>
      this.ascending ? compare(left, right) : -compare(left, right),
    )
  }

  // A field the caller supplied no key for falls back to path, which is how
  // matches stays grep's alone without ResultOrder knowing who called it.
  private comparatorOf<T>(keys: SortKeys<T>): (left: T, right: T) => number {
    const numeric = this.field === 'path' ? undefined : keys[this.field]
    if (!numeric) return (left, right) => keys.path(left).localeCompare(keys.path(right))
    return (left, right) => numeric(left) - numeric(right)
  }
}
