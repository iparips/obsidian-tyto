import { DataAdapter } from 'obsidian'
import { AgentsMdFile } from './agents-md-file'
import { AgentsMdChain } from './agents-md-chain'
import { AncestorFolders } from './ancestor-folders'
import { ChainBudget } from './chain-budget'

const FILE_NAMES = ['AGENTS.md', 'CLAUDE.md']

// An absent, unreadable or blank file is an empty result rather than a failure,
// so a vault with neither name behaves exactly as one built before them (FR11).
export class AgentsMdRepository {
  // Keyed by folder, since every note in a folder shares a chain. Never
  // invalidated: editing an instruction file mid-session keeps the stale chain.
  private readonly chains = new Map<string, AgentsMdChain>()

  constructor(private adapter: DataAdapter) {}

  async resolveFor(notePath: string): Promise<AgentsMdChain> {
    const folder = AgentsMdRepository.folderOf(notePath)
    const cached = this.chains.get(folder)
    if (cached) return cached
    const chain = await this.walk(notePath)
    this.chains.set(folder, chain)
    return chain
  }

  private async walk(notePath: string): Promise<AgentsMdChain> {
    const folders = AncestorFolders.of(notePath)
    const found = await Promise.all(folders.map((folder) => this.readFolder(folder)))
    return ChainBudget.apply(found.filter((file): file is AgentsMdFile => file !== null))
  }

  // One file per folder: an AGENTS.md that reads at all suppresses the
  // CLAUDE.md, so a symlinked pair never duplicates instructions (FR2).
  private async readFolder(folder: string): Promise<AgentsMdFile | null> {
    for (const fileName of FILE_NAMES) {
      const contents = await this.readFile(AgentsMdRepository.pathOf(folder, fileName))
      if (contents !== null) return AgentsMdRepository.fileOf(folder, fileName, contents)
    }
    return null
  }

  // Blank contents drop the file rather than emitting a labelled empty block,
  // which would cost tokens and give the model nothing to read (FR12).
  private static fileOf(folder: string, fileName: string, contents: string): AgentsMdFile | null {
    return contents.trim() ? new AgentsMdFile(folder, fileName, contents) : null
  }

  private static pathOf(folder: string, fileName: string): string {
    return folder === '' ? fileName : `${folder}/${fileName}`
  }

  private async readFile(path: string): Promise<string | null> {
    try {
      return await this.adapter.read(path)
    } catch {
      return null
    }
  }

  private static folderOf(notePath: string): string {
    const cut = notePath.lastIndexOf('/')
    return cut === -1 ? '' : notePath.slice(0, cut)
  }
}
