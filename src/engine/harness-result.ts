import { CommandEffect } from '../commands/models/command-effect'
import { SeenPaths } from '../search/models/seen-paths'
import { AnswerRequest } from './models/answer-request'
import { TurnBudget } from './models/turn-budget'
import { TurnStep } from './models/turn-step'

// What the harness tools return to the model. A command effect, a resolved open
// path and a question travel beside the text, because only the loop can act on
// any of them.
export interface HarnessResult {
  result: string
  effect?: CommandEffect
  answer?: { text: string; sources: string[] }
  openPath?: string
  question?: AnswerRequest
  // What the panel shows in the steps list. Present on every call, including
  // the ones that refused, so a turn that went nowhere still says why.
  step?: TurnStep
}

// What a tool reads off the turn it runs in. Narrower than TurnRepository, so
// the tools see the two counters they spend and nothing else.
export interface TurnState {
  readonly budget: TurnBudget
  readonly seenPaths: SeenPaths
}

// Shared by every tool that can refuse, so a cap message and a bad argument
// reach the model in one shape rather than two.
export class Refusal {
  // Every refusal is a step, since it spent an iteration and is usually what
  // the user most needs to see when a turn goes nowhere.
  static of(reason: string): HarnessResult {
    return { result: reason, step: TurnStep.refused(reason) }
  }
}
