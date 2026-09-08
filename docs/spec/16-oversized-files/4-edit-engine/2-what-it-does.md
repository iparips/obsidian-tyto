# What EditEngine Did

Every method before the three extractions, as pseudocode. Kept because it is
what the responsibilities below were read off.

```
EditEngine
  holds: modelProvider, sessionRepository, noteEditor,
         harnessTools, turnFactory, turnProgressPublisher
  state: queue (single-flight chain), runningTurn

  followActiveNote(path)
    if path is already the target -> nothing
    changeTargetNote, publish retargeted

  cancelTurn()
    runningTurn?.cancellation.cancel()

  processUtterance(text)
    chain onto queue so utterances run one at a time
    runTurn(text)

      append the utterance to history      // before opening: a turn that could
      turn = turnFactory.openTurn()        // not open was still spoken to
      if that failed -> failure
      runAgentLoop(turn), clearing runningTurn after

        loop until the iteration budget is spent:
          if cancelled                -> concludeCancelled
          answer = askModel(...)
          if not success              -> concludeUnfinished
          log the iteration
          if answer is text           -> concludeUtterance
          executeToolCalls(answer.calls)
          if refusals stuck           -> concludeStuck
          spend the budget, warn if low
        exhausted                     -> concludeExhausted

        askModel  builds the four messages, calls the provider
        executeToolCalls  dispatches each call, appends its result to history,
                          stores the edit position, counts refusals
```
