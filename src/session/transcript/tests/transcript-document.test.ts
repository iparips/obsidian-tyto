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
      const document = documentOf({
        settings: { editModel: 'mistral-medium-latest', searchEnabled: true },
      })

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
            lines: [
              {
                label: 'Globbed',
                detail: '**/*.md',
                refused: false,
                note: null,
                wroteDirect: false,
              },
            ],
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
              {
                label: 'Refused',
                detail: 'not chosen by the user',
                refused: true,
                note: null,
                wroteDirect: false,
              },
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
            {
              label: 'Globbed',
              detail: '**/a.md - 1 note',
              refused: false,
              note: null,
              wroteDirect: false,
            },
            {
              label: 'Globbed',
              detail: '**/b.md - nothing matched',
              refused: false,
              note: null,
              wroteDirect: false,
            },
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

    it('renders the sentence and the calls when a reply carried both', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'find it' }],
        history: [
          ChatMessage.user('find it'),
          ChatMessage.modelToolCalls([aGlob('**/a.md')], 'Searching the vault now.'),
          ChatMessage.toolCallResult('c1', 'a.md'),
        ],
        steps: [
          aStep(0, new StepRange(0, 0), new StepRange(0, -1)),
          aStep(1, new StepRange(1, 2), new StepRange(0, -1)),
        ],
      })

      expect(document).toContain('- text: Searching the vault now.')
      expect(document).toContain('- tool call glob_notes')
    })

    it('says the provider call did not return when the step recorded no reply', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'find it' }],
        history: [ChatMessage.user('find it')],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, -1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Failed, 0)],
      })

      expect(document).toContain('- no reply recorded: the provider call did not return')
      expect(document).not.toContain('nothing recorded')
    })

    it('says the reply was empty when the model answered with neither words nor calls', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'find it' }],
        history: [ChatMessage.user('find it'), ChatMessage.model('')],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, -1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Replied, 0)],
      })

      expect(document).toContain('- the model returned an empty reply')
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
            lines: [
              {
                label: 'Read',
                detail: '',
                refused: false,
                note: 'Lists/todo.md',
                wroteDirect: false,
              },
            ],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 0))],
        endings: [new RecordedEnding(0, TurnEndingKind.Replied, 0)],
      })

      expect(document).toContain('- Read - Lists/todo.md')
    })

    // The reported defect: a turn that replied has the next turn's work sitting
    // after it in the history, and an unbounded tail swept it into this turn's
    // step. The transcript then showed a stalled turn calling five tools.
    it('leaves the next turns work out of a turn that ended on a reply', () => {
      const document = documentOf({
        items: [
          { kind: 'turn', target: 'todo.md', entries: [{ kind: 'user', text: 'add milk' }] },
          { kind: 'turn', target: 'todo.md', entries: [{ kind: 'user', text: 'ok' }] },
        ],
        history: [
          ChatMessage.user('add milk'),
          ChatMessage.model('I need to load the skill first.'),
          ChatMessage.user('ok'),
          ChatMessage.modelToolCalls([aGlob('**/todo.md')]),
          ChatMessage.toolCallResult('c1', 'todo.md'),
        ],
        steps: [
          new RecordedTurnStep(0, 0, aPart(1), new StepRange(0, 0), new StepRange(0, -1)),
          new RecordedTurnStep(1, 0, aPart(1), new StepRange(2, 2), new StepRange(0, -1)),
        ],
        endings: [
          new RecordedEnding(0, TurnEndingKind.Replied, 0),
          new RecordedEnding(1, TurnEndingKind.Replied, 0),
        ],
      })

      expect(turnSectionOf(document, 1)).not.toContain('glob_notes')
    })

    it('keeps the reply that did end the turn', () => {
      const document = documentOf({
        items: [
          { kind: 'turn', target: 'todo.md', entries: [{ kind: 'user', text: 'add milk' }] },
          { kind: 'turn', target: 'todo.md', entries: [{ kind: 'user', text: 'ok' }] },
        ],
        history: [
          ChatMessage.user('add milk'),
          ChatMessage.model('I need to load the skill first.'),
          ChatMessage.user('ok'),
          ChatMessage.modelToolCalls([aGlob('**/todo.md')]),
        ],
        steps: [
          new RecordedTurnStep(0, 0, aPart(1), new StepRange(0, 0), new StepRange(0, -1)),
          new RecordedTurnStep(1, 0, aPart(1), new StepRange(2, 2), new StepRange(0, -1)),
        ],
        endings: [
          new RecordedEnding(0, TurnEndingKind.Replied, 0),
          new RecordedEnding(1, TurnEndingKind.Replied, 0),
        ],
      })

      expect(turnSectionOf(document, 1)).toContain('I need to load the skill first.')
    })

    // Answered joins Replied in keeping the tail whole: the turn's closing
    // message is the model's own answer, and trimming it would drop the very
    // text the ending put there.
    it('keeps the answer that ended the turn', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'what was the roofing quote' }],
        history: [
          ChatMessage.user('what was the roofing quote'),
          ChatMessage.modelToolCalls([aGlob('Quotes/*.md')]),
          ChatMessage.toolCallResult('c1', 'Quotes/roofing.md'),
          ChatMessage.model('The roofing quote was 12k.'),
        ],
        steps: [aStep(0, new StepRange(0, 1), new StepRange(0, -1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Answered, 0)],
      })

      expect(document).toContain('The roofing quote was 12k.')
    })

    it('trims the harness note from a turn the user cancelled', () => {
      const document = documentOf({
        entries: [{ kind: 'user', text: 'add milk' }],
        history: [
          ChatMessage.user('add milk'),
          ChatMessage.modelToolCalls([aGlob('**/todo.md')]),
          ChatMessage.toolCallResult('c1', 'todo.md'),
          ChatMessage.model('Stopped. Nothing was changed.'),
        ],
        steps: [aStep(0, new StepRange(0, 1), new StepRange(0, -1))],
        endings: [new RecordedEnding(0, TurnEndingKind.Cancelled, 0)],
      })

      expect(document).not.toContain('Stopped. Nothing was changed.')
    })

    // The document is read away from the panel, so the mark is words rather than
    // a colour: an edit the editor cannot take back has to say so in the text.
    it('marks an edit that went straight to the file', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'add milk' },
          {
            kind: 'progress',
            lines: [
              {
                label: 'Edit',
                detail: 'applied',
                refused: false,
                note: 'todo.md',
                wroteDirect: true,
              },
            ],
          },
        ],
        steps: [aStep(0, new StepRange(0, 0), new StepRange(0, 0))],
        endings: [new RecordedEnding(0, TurnEndingKind.Replied, 0)],
      })

      expect(document).toContain(
        '- Edit - applied - todo.md - written directly, undo not available',
      )
    })

    it('nests both progress lines of a turn step that returned two tool calls', () => {
      const document = documentOf({
        entries: [
          { kind: 'user', text: 'do both' },
          {
            kind: 'progress',
            lines: [
              { label: 'Edit', detail: 'applied', refused: false, note: null, wroteDirect: false },
              {
                label: 'Edit',
                detail: 'applied again',
                refused: false,
                note: null,
                wroteDirect: false,
              },
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
                wroteDirect: false,
              },
              {
                label: 'Globbed',
                detail: '**/a.md',
                refused: false,
                note: null,
                wroteDirect: false,
              },
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

    // A turn refused before its first model call has no step to slice to, so
    // the end of the slice is the session's line count and only its start keeps
    // the previous turn's lines out.
    describe('on a turn that spent no steps', () => {
      const aLine = (label: string) => ({
        label,
        detail: '',
        refused: false,
        note: null,
        wroteDirect: false,
      })

      const twoTurns = (secondTurnLines: string[]) => [
        {
          kind: 'turn' as const,
          target: 'Journal/09-09-Wed.md',
          entries: [
            { kind: 'user' as const, text: 'first' },
            {
              kind: 'progress' as const,
              lines: [aLine('Ran a command'), aLine('Edited the note')],
            },
          ],
        },
        {
          kind: 'turn' as const,
          target: 'Journal/09-09-Wed.md',
          entries: [
            { kind: 'user' as const, text: 'second' },
            ...(secondTurnLines.length === 0
              ? []
              : [{ kind: 'progress' as const, lines: secondTurnLines.map(aLine) }]),
          ],
        },
      ]

      it('prints only its own lines', () => {
        const document = documentOf({
          items: twoTurns(['Loaded agent instructions']),
          steps: [new RecordedTurnStep(0, 0, aPart(), new StepRange(0, 0), new StepRange(0, 1))],
        })

        const setup = document.slice(document.indexOf('### Setup', document.indexOf('second')))
        expect(setup.split('\n').filter((line) => line.startsWith('- '))).toEqual([
          '- Loaded agent instructions',
        ])
      })

      it('leaves the previous turn`s command and edit in the previous turn', () => {
        const document = documentOf({
          items: twoTurns(['Loaded agent instructions']),
          steps: [new RecordedTurnStep(0, 0, aPart(), new StepRange(0, 0), new StepRange(0, 1))],
        })

        const secondTurnAt = document.indexOf('Utterance: second')
        expect(document.slice(secondTurnAt)).not.toContain('- Ran a command')
        expect(document.slice(secondTurnAt)).not.toContain('- Edited the note')
      })

      it('prints no Setup block when it produced no lines of its own', () => {
        const document = documentOf({
          items: twoTurns([]),
          steps: [new RecordedTurnStep(0, 0, aPart(), new StepRange(0, 0), new StepRange(0, 1))],
        })

        expect(document.slice(document.indexOf('Utterance: second'))).not.toContain('### Setup')
      })
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

// One turn's section alone, so a case about what a turn holds cannot pass on
// text that belongs to the turn after it.
const turnSectionOf = (document: string, turn: number): string =>
  document.split('## Conversation turn ')[turn] ?? ''

// Asserted as an order rather than as one string, so a case says what has to
// come before what without freezing the blank lines between them.
const lineOrderIn = (document: string, lines: string[]): boolean =>
  lines.every((line, index) => {
    const at = document.indexOf(line)
    return at !== -1 && (index === 0 || at > document.indexOf(lines[index - 1]))
  })
