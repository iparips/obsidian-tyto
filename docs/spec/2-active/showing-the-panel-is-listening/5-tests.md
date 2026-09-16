---
created: 2026-09-16
updated: 2026-09-16
---

# Tests

## Setup

- A vault with at least one markdown note
- Microphone permission granted
- A Tyto session running

### A recording says it is recording

```gherkin
Given the panel is idle
When  the user presses the record button
Then  a strip above the input row holds a clock and a meter
And   the record button reads Stop in the accent colour
And   the instruction field is gone, leaving the meter the width
```

### The meter follows the voice

```gherkin
Given a recording is running
When  the user speaks
Then  the bars rise above their resting floor
And   they fall back when the user stops
```

Bars frozen at rest while the clock still counts is a suspended AudioContext,
not a dead microphone. That is the iOS assumption in 4-decisions.md, and
resume() on the record gesture is the first thing to try.

### A dead microphone looks dead

```gherkin
Given the microphone is muted at the operating system
When  the user speaks into a running recording
Then  the bars stay at their resting floor
And   the floor is visibly lower than speech was
```

A meter that looks the same muted and unmuted is the failure the feature exists
to prevent, whatever the bars are doing.

### Stopping releases everything

```gherkin
Given a recording is running
When  the user presses Stop
Then  the strip is replaced by the transcribing line
And   no audio indicator remains in the operating system
```

### Reduced motion is honoured

```gherkin
Given the user has asked for reduced motion
When  a recording is running and the user speaks
Then  the bars hold still
And   the clock alone counts
```

## Platforms

The two meter checks run on desktop, Android and iOS, since the audio graph is
where the three differ. Android is the faster loop over adb with Chrome
DevTools; iOS needs Safari Web Inspector with a Mac.

A meter working on desktop and Android but frozen on iOS is the suspended
context, not a platform without an analyser.
