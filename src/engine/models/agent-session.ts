import { TFile } from 'obsidian'
import { ChatMessage } from '../../providers/types'
import { EditOperation } from '../note-editor'

export class AgentSession {
  chatHistory: ChatMessage[] = []
  operationHistory: EditOperation[] = []

  constructor(readonly file: TFile) {}
}
