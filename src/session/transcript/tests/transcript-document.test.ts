import { describe, expect, it } from 'vitest'
import { TurnEndingKind } from '../../../engine/turn/ending/turn-ending-kind'
import { ChatMessage, ToolCall } from '../../../model/providers/types'
import { DEFAULT_SETTINGS, TytoSettings } from '../../../settings/settings'
import { PanelEntry, PanelItem } from '../../models/panel-state'
import { TranscriptSource } from '../models/transcript-source'
import {
  RecordedEnding,
  RecordedTurnStep,
  StepRange,
  TranscriptPart,
} from '../models/transcript-record'
import { TranscriptDocument } from '../transcript-document'

// The format is what a failed session is filed as, so the cases assert on the
// document rather than on the classes that build it.
describe('TranscriptDocument', () => {
  const copiedAt = new Date(2026, 8, 10, 15, 25)

  const aPart = (version = 1) => [
    new TranscriptPart('systemPrompt', version, `prompt v${version}`),
    new TranscriptPart('dateMessage', 1, 'today is Wednesday'),
    new TranscriptPart('sessionTarget', 1, 'note context'),
  ]

  const aStep = (step: number, history: StepRange, progressLines: StepRange, version = 1) =>
    new RecordedTurnStep(0, step, aPart(version), history, progressLines)

  const aGlob = (pattern: string) => new ToolCall('c1', 'glob_notes', { pattern })

  // entries are one turn's, which is what most cases are about. items says the
  // shape outright, for the cases about what sits beside a turn.
  const turnOf = (entries: PanelEntry[] = []): PanelItem[] =>
    entries.length === 0 ? [] : [{ kind: 'turn', target: 'Journal/09-09-Wed.md', entries }]

  const documentOf = (options: {
    entries?: PanelEntry[]
    items?: PanelItem[]
    history?: ChatMessage[]
    steps?: RecordedTurnStep[]
    endings?: RecordedEnding[]
    parts?: TranscriptPart[]
    settings?: Partial<TytoSettings>
    notePath?: string | null
  }) =>
    TranscriptDocument.write(
      new TranscriptSource(
        {
          copiedAt,
          pluginVersion: '0.1.0',
          notePath: options.notePath === undefined ? 'Journal/09-09-Wed.md' : options.notePath,
        },
        { ...DEFAULT_SETTINGS, ...options.settings },
        options.items ?? turnOf(options.entries),
        options.history ?? [],
        options.steps ?? [],
        options.endings ?? [],
        options.parts ?? [],
      ),
    )

  describe('the metadata table', () => {
    it('names the note, the model and the search setting', () => {
      const document = documentOf({ settings: { editModel: 'mistral-medium-latest' } })

      expect(document).toContain('| Note | Journal/09-09-Wed.md |')
      expect(document).toContain('| Model | mistral-medium-latest |')
      expect(document).toContain('| Search | enabled |')
    })

    it('never names the API key, which is what makes a transcript safe to paste', () => {
      const document = documentOf({ settings: { mistralApiKey: 'sk-do-not-copy-me' } })

      expect(document).not.toContain('sk-do-not-copy-me')
      expect(document.toLowerCase()).not.toContain('api key')
    })

    it('counts the conversation turns and the turn steps it spent', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'do it' }],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, -1))],
      })

      expect(document).toContain('| Turns | 1 conversation turn, 1 turn step |')
    })
  })

  describe('the entries a turn showed', () => {
    it('renders an utterance, a steps list and an error in the order they happened', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'rename it' },
          {
            kind: 'progress',
            lines: [{ label: 'Globbed', detail: '**/*.md', refused: false, note: null }],
          },
          { kind: 'error', step: 'chat', text: 'Tyto ran out of steps' },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 0))],
        endings: [new RecordedEnding(0, TurnEndingKind.Exhausted, 0)],
      })

      expect(
        lineOrderIn(document, ['Utterance: rename it', '- Globbed - **/*.md', 'Error (chat)']),
      ).toBe(true)
    })

    it('renders an answer with its sources', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'what did I write' },
          { kind: 'answer', text: 'you wrote about the budget', sources: ['a.md', 'b.md'] },
        ],
      })

      expect(document).toContain('Answer: you wrote about the budget')
      expect(document).toContain('Sources: a.md, b.md')
    })

    it('renders a choice with what was picked and what was offered', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'open it' },
          { kind: 'choice', candidates: ['a.md', 'b.md'], pending: false, text: 'Chose a.md' },
        ],
      })

      expect(document).toContain('Choice: Chose a.md')
      expect(document).toContain('Offered: a.md, b.md')
    })

    it('renders a question with what was answered', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'tidy it' },
          { kind: 'question', pending: false, suggestions: [], text: 'Which section?' },
        ],
      })

      expect(document).toContain('Question: Which section?')
      expect(document).not.toContain('Still waiting on the user')
    })

    it('renders a cancellation, a warning and resolved instructions', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'go' },
          { kind: 'instructions', text: 'Loaded agent instructions - vault root' },
          { kind: 'warning', text: 'Tyto is taking longer than usual' },
          { kind: 'cancelled', text: 'Stopped. Nothing was changed.' },
        ],
      })

      expect(document).toContain('- Loaded agent instructions - vault root')
      expect(document).toContain('- Warned - Tyto is taking longer than usual')
      expect(document).toContain('Cancelled: Stopped. Nothing was changed.')
    })

    it('renders the restored line, which is what marks where a session came back', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'go' },
          { kind: 'restored', text: 'Session restored from 2026-09-11 14:32 AEST.' },
        ],
      })

      expect(document).toContain('- Session restored from 2026-09-11 14:32 AEST.')
    })

    it('marks the refused steps, which is what a turn that went nowhere is made of', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'open it' },
          {
            kind: 'progress',
            lines: [
              { label: 'Refused', detail: 'not chosen by the user', refused: true, note: null },
            ],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 0))],
      })

      expect(document).toContain('- Refused - not chosen by the user - refused')
    })
  })

  describe('the turn steps a turn spent', () => {
    const twoSteps = () => ({
      entries: [
        { kind: 'user', text: 'find it' },
        {
          kind: 'progress',
          lines: [
            { label: 'Globbed', detail: '**/a.md - 1 note', refused: false, note: null },
            { label: 'Globbed', detail: '**/b.md - nothing matched', refused: false, note: null },
          ],
        },
      ] as PanelEntry[],
      history: [
        ChatMessage.user('find it'),
        ChatMessage.modelToolCalls([aGlob('**/a.md')]),
        ChatMessage.toolCallResult('c1', 'a.md'),
        ChatMessage.modelToolCalls([aGlob('**/b.md')]),
        ChatMessage.toolCallResult('c1', 'nothing matched'),
      ],
      steps: [
        aStep(0, new StepRange(0, 0), new StepRange(0, 0)),
        aStep(1, new StepRange(1, 2), new StepRange(1, 1)),
      ],
      endings: [new RecordedEnding(0, TurnEndingKind.Exhausted, 1)],
    })

    it('writes a section per turn step, each naming the parts it was sent', () => {
      const document = documentOf(twoSteps())

      expect(document).toContain('### Turn step 1')
      expect(document).toContain('### Turn step 2')
      expect(document).toContain('- system prompt v1, date v1, note context v1')
    })

    it('names the history messages sent since the step before it', () => {
      const document = documentOf(twoSteps())

      expect(document).toContain('- user: find it')
      expect(document).toContain('- tool result\n\n  ```text\n  a.md\n  ```')
    })

    it('names what the model returned, read off the step that follows it', () => {
      const document = documentOf(twoSteps())

      expect(document).toContain('- tool call glob_notes')
      expect(document).toContain('"pattern": "**/a.md"')
      expect(document).toContain('"pattern": "**/b.md"')
    })

    it('fences a multi-line tool result, so a listing reads as a list', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'find it' }],
        history: [
          ChatMessage.user('find it'),
          ChatMessage.modelToolCalls([aGlob('**/a.md')]),
          ChatMessage.toolCallResult('c1', 'a.md\nb.md'),
        ],
        steps: [
          aStep(0, new StepRange(0, 0), new StepRange(0, -1)),
          aStep(1, new StepRange(1, 2), new StepRange(0, -1)),
        ],
      })

      expect(document).toContain('- tool result\n\n  ```text\n  a.md\n  b.md\n  ```')
    })

    it('fences the arguments as prettified json, which is what a step is diagnosed from', () => {
      const document = documentOf(twoSteps())

      expect(document).toContain(
        '- tool call glob_notes\n\n  ```json\n  {\n    "pattern": "**/a.md"\n  }\n  ```',
      )
    })

    it('nests the progress lines each turn step produced, in order', () => {
      const document = documentOf(twoSteps())

      expect(
        lineOrderIn(document, [
          '### Turn step 1',
          '- Globbed - **/a.md - 1 note',
          '### Turn step 2',
          '- Globbed - **/b.md - nothing matched',
        ]),
      ).toBe(true)
    })

    // The document has no turn header beside the line to compare a note
    // against, so a line names its note whatever the turn's target was.
    it('writes the note a line acted on beside its label', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'read it' },
          {
            kind: 'progress',
            lines: [{ label: 'Read', detail: '', refused: false, note: 'Lists/todo.md' }],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 0))],
        endings: [new RecordedEnding(0, TurnEndingKind.Replied, 0)],
      })

      expect(document).toContain('- Read - Lists/todo.md')
    })

    it('nests both progress lines of a turn step that returned two tool calls', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'do both' },
          {
            kind: 'progress',
            lines: [
              { label: 'Edit', detail: 'applied', refused: false, note: null },
              { label: 'Edit', detail: 'applied again', refused: false, note: null },
            ],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Replied, 0)],
      })

      expect(document).toContain('- Edit - applied\n- Edit - applied again')
    })

    it('carries continue on every step but the one that ended the turn', () => {
      const document = documentOf(twoSteps())

      expect(document.match(/- Outcome: continue/g)).toHaveLength(1)
      expect(document).toContain('- Outcome: exhausted')
    })

    it('names stuck apart from exhausted, which the panel shows as one message', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'open it' },
          { kind: 'error', step: 'chat', text: 'Tyto was refused the same thing twice' },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, -1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Stuck, 0)],
      })

      expect(document).toContain('- Outcome: stuck')
      expect(document).toContain('Error (chat): Tyto was refused the same thing twice')
    })
  })

  describe('the Setup block', () => {
    it('holds the progress lines published before the first model call', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'go' },
          {
            kind: 'progress',
            lines: [
              {
                label: 'Loaded agent instructions',
                detail: 'vault root',
                refused: false,
                note: null,
              },
              { label: 'Globbed', detail: '**/a.md', refused: false, note: null },
            ],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(1, 1))],
      })

      expect(
        lineOrderIn(document, [
          '### Setup',
          '- Loaded agent instructions - vault root',
          '### Turn step 1',
          '- Globbed - **/a.md',
        ]),
      ).toBe(true)
    })

    it('is absent when the first model call came before anything was published', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, -1))],
      })

      expect(document).not.toContain('### Setup')
    })
  })

  describe('a skill body', () => {
    const aLoad = (id: string, name: string) => new ToolCall(id, 'load_skill', { name })

    const loadedSkill = (result: string) => ({
      entries: [{ kind: 'user', text: 'write it up' }] as PanelEntry[],
      history: [
        ChatMessage.user('write it up'),
        ChatMessage.modelToolCalls([aLoad('c1', 'journal')]),
        ChatMessage.toolCallResult('c1', result),
      ],
      steps: [
        aStep(0, new StepRange(0, 0), new StepRange(0, -1)),
        aStep(1, new StepRange(1, 2), new StepRange(0, -1)),
      ],
    })

    it('goes to the appendix, cited from the step that loaded it', () => {
      const document = documentOf(loadedSkill('# Journal\n\nFile daily notes under Weekly.'))

      expect(document).toContain('- tool result: skill journal, in the appendix')
      expect(document).toContain('## Appendix: skills loaded')
      expect(document).toContain('### Skill journal')
      expect(document).toContain('File daily notes under Weekly.')
    })

    it('is written once however many steps carry it through the history', () => {
      const document = documentOf(loadedSkill('# Journal\n\nFile daily notes under Weekly.'))

      expect(document.match(/File daily notes under Weekly\./g)).toHaveLength(1)
    })

    it('stays in the step when the load was refused, where the refusal is the point', () => {
      const document = documentOf(loadedSkill('no skill named journal in this vault'))

      expect(document).toContain('no skill named journal in this vault')
      expect(document).not.toContain('## Appendix: skills loaded')
    })
  })

  describe('the appendix', () => {
    it('writes a repeated part once and cites it from both steps', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        steps: [
          aStep(0, new StepRange(0, 0), new StepRange(0, -1)),
          aStep(1, new StepRange(1, 1), new StepRange(0, -1)),
        ],
        parts: [new TranscriptPart('systemPrompt', 1, 'prompt v1')],
      })

      expect(document.match(/### System prompt v1/g)).toHaveLength(1)
      expect(document.match(/- system prompt v1/g)).toHaveLength(2)
    })

    it('fences a part longer than the fences it holds, so a quoted note cannot break out', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        parts: [
          new TranscriptPart('sessionTarget', 1, 'Note content:\n```markdown\n# Wednesday\n```'),
        ],
      })

      expect(document).toContain('````text\nNote content:\n```markdown\n# Wednesday\n```\n````')
    })

    // The note context is re-read from the editor every step, so a session that
    // edits one line would otherwise write the whole note again.
    it('writes a changed part as a diff against the version before it', () => {
      const note = (extra: string) =>
        [
          'Note path: a.md',
          '# Wednesday',
          '',
          '## Morning',
          '- coffee',
          '- standup',
          '',
          '## Evening',
          '- dinner',
          extra,
        ].join('\n')
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        parts: [
          new TranscriptPart('sessionTarget', 1, note('- walk')),
          new TranscriptPart('sessionTarget', 2, note('- a great day')),
        ],
      })

      expect(document).toContain('### Note context v2\n\nChanged from v1:')
      expect(document).toContain('+ - a great day')
      expect(document.match(/# Wednesday/g)).toHaveLength(1)
      expect(document.match(/## Morning/g)).toHaveLength(1)
    })

    it('diffs against the same part, not whatever version was written last', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        parts: [
          new TranscriptPart('sessionTarget', 1, 'note one'),
          new TranscriptPart('systemPrompt', 1, 'prompt one'),
          new TranscriptPart('sessionTarget', 2, 'note two'),
        ],
      })

      expect(document).toContain('- note one')
      expect(document).toContain('+ note two')
      expect(document).not.toContain('- prompt one')
    })

    it('writes a part that changed mid-session again under a new version', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'go' }],
        steps: [
          aStep(0, new StepRange(0, 0), new StepRange(0, -1), 1),
          aStep(1, new StepRange(1, 1), new StepRange(0, -1), 2),
        ],
        parts: [
          new TranscriptPart('systemPrompt', 1, 'prompt v1'),
          new TranscriptPart('systemPrompt', 2, 'prompt v2'),
        ],
      })

      expect(document).toContain('### System prompt v1')
      expect(document).toContain('### System prompt v2')
      expect(document).toContain('+ prompt v2')
    })
  })

  describe('the copied stamp', () => {
    // The zone is the machine's, so the row is bounded rather than named: a
    // suite that names one zone fails on a machine in another.
    it('names the day and time the transcript was copied', () => {
      const document = documentOf({ entries: [{ kind: 'user', text: 'hello' }] })

      expect(document).toContain('| Copied | 2026-09-10 15:25 ')
    })
  })

  // What precedes the first turn belongs to none and was once dropped. A
  // session restored before the user spoke is that case.
  describe('the entries before the first turn', () => {
    it('writes a restore that arrived before the user spoke', () => {
      const document = documentOf({
        items: [
          { kind: 'restored', text: 'Session restored.' },
          ...turnOf([{ kind: 'user', text: 'add milk' }]),
        ],
      })

      expect(document).toContain('- Session restored.')
    })

    it('writes them above the turn that followed', () => {
      const document = documentOf({
        items: [
          { kind: 'restored', text: 'Session restored.' },
          ...turnOf([{ kind: 'user', text: 'add milk' }]),
        ],
      })

      expect(
        lineOrderIn(document, [
          '- Session restored.',
          '## Conversation turn 1',
          'Utterance: add milk',
        ]),
      ).toBe(true)
    })

    it('opens no such block when the session starts on an utterance', () => {
      const document = documentOf({ entries: [{ kind: 'user', text: 'add milk' }] })

      expect(document).not.toContain('## Before the first turn')
    })
  })

  describe('a session with no turn steps', () => {
    it('renders the metadata and the utterance alone', () => {
      const document = documentOf({ entries: [{ kind: 'user', text: 'hello' }] })

      expect(document).toContain('## Session metadata')
      expect(document).toContain('Utterance: hello')
      expect(document).not.toContain('### Turn step')
    })
  })
})

// Asserted as an order rather than as one string, so a case says what has to
// come before what without freezing the blank lines between them.
const lineOrderIn = (document: string, lines: string[]): boolean =>
  lines.every((line, index) => {
    const at = document.indexOf(line)
    return at !== -1 && (index === 0 || at > document.indexOf(lines[index - 1]))
  })
