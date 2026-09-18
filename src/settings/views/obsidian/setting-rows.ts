import { SettingDefinition } from 'obsidian'

// The rows whose whole definition is data: a name, a description and the
// settings key its control writes. The rows that need the tab itself, because
// they mask a value or mount a React root, stay on TytoSettingsTab.
export const MODEL_ROWS: SettingDefinition[] = [
  {
    name: 'Edit model',
    desc: 'The Mistral model that reads your instruction and edits the note.',
    control: { type: 'text', key: 'editModel' },
  },
  {
    name: 'Turn step budget',
    desc: 'How much one instruction may spend before Tyto stops and reports. A turn step is one model call and the tool calls it returned, and the panel lists them as they run. Raise it for instructions that read many notes; lower it to cap what a turn costs.',
    control: { type: 'number', key: 'maxTurnSteps', min: 1, max: 100, step: 1 },
  },
]

export const SKILLS_ROWS: SettingDefinition[] = [
  {
    name: 'Skills folder',
    desc: 'Vault folder holding agent skills. Their names and descriptions are sent with each instruction. Leave empty to disable.',
    control: { type: 'folder', key: 'skillsPath' },
  },
]

export const VAULT_ROWS: SettingDefinition[] = [
  {
    name: 'Search the vault to answer questions',
    desc: 'Tyto can search your notes and summarise what it finds in the panel. The summary is never written into a note.',
    control: { type: 'toggle', key: 'searchEnabled' },
  },
  {
    name: 'Ask before opening a note Tyto found',
    desc: 'Tyto can search for the note an instruction names and open it. Ask shows you what it found and waits for you to pick one. Open opens a note when only one matched, and still asks when several did. A note one of your commands opens never asks.',
    control: {
      type: 'dropdown',
      key: 'openMode',
      options: { confirm: 'Ask which note', auto: 'Open the only match' },
    },
  },
  {
    name: 'Copy the session transcript',
    desc: 'Adds a Copy button to the panel header. The transcript holds the whole session as Markdown, including your note text and any vault instructions, so a turn that went wrong can be filed rather than described. Your key is never in it.',
    control: { type: 'toggle', key: 'transcriptCopyEnabled' },
  },
]
