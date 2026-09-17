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
Then  the instruction field is replaced by a clock and a trail of bars
And   the record button reads Send in the accent colour
And   the record and cancel buttons stay where they were
```

### The trail follows the voice

```gherkin
Given a recording is running
When  the user speaks
Then  the bars rise above their resting floor
And   the raised bars travel left as the recording continues
```

Bars frozen at rest while the clock still counts is a suspended AudioContext,
not a dead microphone. That is the iOS assumption in 4-decisions.md, and
resume() on the record gesture is the first thing to try.

### A dead microphone looks dead

```gherkin
Given the microphone is muted at the operating system
When  the user speaks into a running recording
Then  the trail is a flat line at its resting floor
And   the flat line is visibly lower than speech was
```

A strip that looks the same muted and unmuted is the failure the feature exists
to prevent. The trail is what makes this readable at a glance, per D5: a level
meter at the floor is a quiet room and a dead microphone alike.

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
