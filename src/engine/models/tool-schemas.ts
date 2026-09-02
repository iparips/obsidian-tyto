import { ToolSchema } from '../../providers/types'
import { LOAD_SKILL } from '../../providers/models/tool-call'

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
]
