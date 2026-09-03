import { ToolSchema } from '../../providers/types'
import {
  ANSWER_FROM_SEARCH,
  ASK_USER,
  LOAD_SKILL,
  OPEN_NOTE,
  READ_NOTE,
  RUN_COMMAND,
  SEARCH_VAULT,
} from '../../providers/models/tool-call'

const ANCHOR_DESCRIPTION =
  'Exact text currently in the note. Must match exactly once. Include enough surrounding text to be unique.'

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'replace_text',
    description: 'Replace one exact, unique occurrence of anchor_text with replacement.',
    parameters: {
      type: 'object',
      properties: {
        anchor_text: { type: 'string', description: ANCHOR_DESCRIPTION },
        replacement: { type: 'string' },
      },
      required: ['anchor_text', 'replacement'],
    },
  },
  {
    name: 'insert_text',
    description:
      'Insert content immediately before or after one exact, unique occurrence of anchor_text.',
    parameters: {
      type: 'object',
      properties: {
        anchor_text: { type: 'string', description: ANCHOR_DESCRIPTION },
        position: { type: 'string', enum: ['before', 'after'] },
        content: { type: 'string' },
      },
      required: ['anchor_text', 'position', 'content'],
    },
  },
  {
    name: 'insert_at',
    description: 'Insert content at a fixed location in the note.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', enum: ['note_start', 'note_end', 'cursor'] },
        content: { type: 'string' },
      },
      required: ['location', 'content'],
    },
  },
  {
    name: LOAD_SKILL,
    description:
      'Read the full instructions of one vault skill listed above. Call this before following a skill, so you work from its steps rather than its summary.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The skill name exactly as listed.' },
      },
      required: ['name'],
    },
  },
  {
    name: RUN_COMMAND,
    description:
      'Run one Obsidian command from the list above. Use this to open the note an instruction names, then edit that note with the anchor tools.',
    parameters: {
      type: 'object',
      properties: {
        command_id: { type: 'string', description: 'The command id exactly as listed.' },
      },
      required: ['command_id'],
    },
  },
  {
    name: SEARCH_VAULT,
    description:
      'Search every note in the vault for a query, returning matching paths with an excerpt around each match.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        modified_within_days: {
          type: 'number',
          description: 'Only consider notes modified within this many days. Use it for "recently".',
        },
      },
      required: ['query'],
    },
  },
  {
    name: READ_NOTE,
    description:
      'Read one note in full, by a path a search returned. This does not change the note the edit tools write to.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The note path exactly as a search returned it.' },
      },
      required: ['path'],
    },
  },
  {
    name: ANSWER_FROM_SEARCH,
    description:
      'Answer a question from what a search found. The answer reaches the user as a copyable block and is never written into a note.',
    parameters: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Every note path the answer drew on.',
        },
      },
      required: ['answer', 'sources'],
    },
  },
  {
    name: OPEN_NOTE,
    description:
      'Open an existing note by a path a search returned, making it the note the edit tools write to. Use this only when no listed command opens the note the user named.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The note path exactly as a search returned it.' },
      },
      required: ['path'],
    },
  },
  {
    name: ASK_USER,
    description:
      'Ask the user one question and act on their answer in this same turn. Use it only when no listed command and no search resolves what the instruction named.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: "One question, in the user's own terms." },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Answers the user can pick without typing. Omit when none fit.',
        },
      },
      required: ['question'],
    },
  },
]

// The two flows are independent, so each set is offered only where it can act:
// a vault allowing no commands and disabling search is offered the release 3
// tools exactly (NFR8).
export class ToolCatalogue {
  static forCapabilities(
    commandsAllowed: boolean,
    searchEnabled: boolean,
    spent: readonly string[] = [],
  ): ToolSchema[] {
    return TOOL_SCHEMAS.filter(
      (schema) =>
        !spent.includes(schema.name) &&
        ToolCatalogue.isOffered(schema.name, commandsAllowed, searchEnabled),
    )
  }

  private static isOffered(
    name: string,
    commandsAllowed: boolean,
    searchEnabled: boolean,
  ): boolean {
    if (name === RUN_COMMAND) return commandsAllowed
    if (SEARCH_TOOLS.includes(name)) return searchEnabled
    // Asking is what is left once the routes are exhausted, so a vault with no
    // route to exhaust is offered the release 3 tools exactly (NFR7).
    if (name === ASK_USER) return commandsAllowed || searchEnabled
    return true
  }
}

// open_note joins them because a search hit is the only source of a path it
// accepts, so a vault with search off can never offer it one (NFR4).
const SEARCH_TOOLS: string[] = [SEARCH_VAULT, READ_NOTE, ANSWER_FROM_SEARCH, OPEN_NOTE]
