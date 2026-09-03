import { ToolSchema } from '../../providers/types'
import {
  ANSWER_FROM_SEARCH,
  ASK_USER,
  CHOOSE_NOTE,
  GLOB_NOTES,
  GREP_NOTES,
  LOAD_SKILL,
  NO_SKILL_APPLIES,
  OPEN_NOTE,
  READ_NOTE,
  RUN_COMMAND,
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
    name: NO_SKILL_APPLIES,
    description:
      "Say that none of this vault's skills covers what the user asked, then carry on. Call it instead of load_skill when you have read the skill list and none matches. You decide which applies; this is how you say none does.",
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'One short phrase saying what the user asked for that no skill covers.',
        },
      },
      required: ['reason'],
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
    name: GLOB_NOTES,
    description:
      'List the notes whose path matches a pattern. Use this before guessing a filename: a folder listing shows the naming convention. Returns paths only. Your first call for a note should end in * so it lists the whole folder, because you cannot know how this vault spells a date or a title until you have seen one.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'A path pattern from the vault root. * matches within one folder, ** across folders, ? one character. Example: 1 - Journal/Weekly/Week-35/*.md. Prefer a trailing * over a spelled-out filename: nothing matched means your pattern was wrong, so widen it rather than reordering the parts.',
        },
        sort: { type: 'string', enum: ['path', 'modified'] },
        order: { type: 'string', enum: ['ascending', 'descending'] },
      },
      required: ['pattern'],
    },
  },
  {
    name: GREP_NOTES,
    description:
      'Find notes whose contents match a regular expression, with an excerpt around each match. Narrow it with path_pattern when you know roughly where to look, or with paths when a listing already showed you which notes matter.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'A JavaScript regular expression, matched case-insensitively across the whole note. Plain text works: most searches need no special characters.',
        },
        path_pattern: {
          type: 'string',
          description: 'Only read notes whose path matches this glob. Same syntax as glob_notes.',
        },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Only read these exact notes, as a previous call returned them. Use it to look inside the few a listing showed were relevant.',
        },
        paths_only: {
          type: 'boolean',
          description:
            'Return paths without excerpts, when the answer is which note rather than what it says.',
        },
        sort: { type: 'string', enum: ['path', 'modified', 'matches'] },
        order: { type: 'string', enum: ['ascending', 'descending'] },
      },
      required: ['pattern'],
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
    name: CHOOSE_NOTE,
    description:
      'Ask the user which note you mean, from paths a search returned. Their pick is both which note and permission to write to it. Call this before open_note, always: even one candidate is theirs to confirm.',
    parameters: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: { type: 'string' },
          description:
            'The note paths to offer, exactly as a search returned them. Offer every note that plausibly matches; the user picks.',
        },
        purpose: {
          type: 'string',
          description:
            'What you will do with the note they pick, in one short phrase. Shown above the list so the user knows what they are agreeing to.',
        },
      },
      required: ['paths', 'purpose'],
    },
  },
  {
    name: ASK_USER,
    description:
      'Ask the user one question and act on their answer in this same turn. Use it only when a search found nothing, or the instruction itself is unclear. Never use it to ask which of several notes they meant: search, then offer them with choose_note.',
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
    // Auto mode opens the first note the model offers, so the tool that asks is
    // absent rather than answering itself (FR13).
    choiceOffered = true,
    // Both skill tools are absent from a vault that defines none, so its prompt
    // and tool list are unchanged.
    skillsExist = false,
  ): ToolSchema[] {
    return TOOL_SCHEMAS.filter((schema) =>
      ToolCatalogue.isOffered(
        schema.name,
        commandsAllowed,
        searchEnabled,
        choiceOffered,
        skillsExist,
      ),
    )
  }

  private static isOffered(
    name: string,
    commandsAllowed: boolean,
    searchEnabled: boolean,
    choiceOffered: boolean,
    skillsExist: boolean,
  ): boolean {
    // load_skill stays offered whatever the vault holds, since release 3's tool
    // list is a fixed contract. Only the new tool is conditional.
    if (name === NO_SKILL_APPLIES) return skillsExist
    if (name === RUN_COMMAND) return commandsAllowed
    if (name === CHOOSE_NOTE) return searchEnabled && choiceOffered
    if (SEARCH_TOOLS.includes(name)) return searchEnabled
    // Asking is what is left once the routes are exhausted, so a vault with no
    // route to exhaust is offered the release 3 tools exactly (NFR7).
    if (name === ASK_USER) return commandsAllowed || searchEnabled
    return true
  }
}

// open_note joins them because a search hit is the only source of a path it
// accepts, so a vault with search off can never offer it one (NFR4).
const SEARCH_TOOLS: string[] = [GLOB_NOTES, GREP_NOTES, READ_NOTE, ANSWER_FROM_SEARCH, OPEN_NOTE]
