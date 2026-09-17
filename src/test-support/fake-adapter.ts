import { DataAdapter } from 'obsidian'

// Mirrors the adapter contract SessionFileStore relies on: read() throws on a
// missing file, and remove() throws on one too, which is what the store
// swallows. The vault-backed repositories use FakeVault instead.
export class FakeAdapter {
  readonly reads: string[] = []
  private unwritable = false

  constructor(private files: Record<string, string> = {}) {}

  asAdapter(): DataAdapter {
    return this as unknown as DataAdapter
  }

  withFile(path: string, source: string): this {
    this.files[path] = source
    return this
  }

  // Every write fails, as a full disk or a read-only vault does.
  withFailingWrites(): this {
    this.unwritable = true
    return this
  }

  contentsOf(path: string): string | undefined {
    return this.files[path]
  }

  async read(path: string): Promise<string> {
    this.reads.push(path)
    const source = this.files[path]
    if (source === undefined) throw new Error(`ENOENT: ${path}`)
    return source
  }

  async write(path: string, source: string): Promise<void> {
    if (this.unwritable) throw new Error(`EACCES: ${path}`)
    this.files[path] = source
  }

  async remove(path: string): Promise<void> {
    if (this.files[path] === undefined) throw new Error(`ENOENT: ${path}`)
    delete this.files[path]
  }
}
