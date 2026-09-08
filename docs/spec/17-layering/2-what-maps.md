# What Maps

Three of the four layers exist. They carry different names, which is why they do
not announce themselves at a glance.

## Controller

The entry points, where something outside calls in.

| Class        | Package | Called by                       |
| ------------ | ------- | ------------------------------- |
| OwlPlugin    | main    | Obsidian, on load and on events |
| SessionPanel | Session | React, on render and on click   |
| EditEngine   | Engine  | The panel, per utterance        |

EditEngine is the one that reads least like a controller, because it also runs
the loop. Three extractions took it from 179 lines to 114, and what is left is
the loop plus the session binding.

## Service

Stateless behaviour holding collaborators rather than state. Around twenty-five
classes, most already named for the verb they perform.

| Class                 | Package   | Does                                   |
| --------------------- | --------- | -------------------------------------- |
| ModelCaller           | Engine    | Turns a turn into a model call         |
| TurnConclusion        | Engine    | Ends a turn five ways                  |
| TargetNoteResolver    | Engine    | Path to a live editor                  |
| NoteEditor            | Engine    | Applies one operation                  |
| NoteChoice            | Engine    | Parks a turn until the user picks      |
| ObsidianCommandRunner | Commands  | Runs a command and reports what opened |
| MistralProvider       | Providers | Calls the model API                    |

Every one of these holds only collaborators. None has a field it mutates.

## Static factories

A shape the three-layer model has no name for, and which is easy to mistake for a
service: no constructor, no state, every method static.

| Class               | Package   | Produces                       |
| ------------------- | --------- | ------------------------------ |
| PromptBuilder       | Engine    | ChatMessage, from four sources |
| TurnStep            | Engine    | One panel entry, fifteen ways  |
| MistralMapper       | Providers | API shapes, both directions    |
| SearchReport        | Search    | The text a search returns      |
| NoteOperationParser | Engine    | An EditOperation from a call   |

These are factories in the tactical sense: they build a value whose construction
is too complex for a constructor. PromptBuilder cannot live on ChatMessage,
which is a Providers value object, because assembling one needs Skill,
AgentsMdChain and AllowedObsidianCommand from three other packages.

The name misleads on two of them. A Builder accumulates across calls before
producing; PromptBuilder and RuleBuilder take every argument at once and return
the finished thing.

## Repository

Storage access. Two classes qualify, and two more use the name without doing the
job.

| Class              | Reads from                 | A repository |
| ------------------ | -------------------------- | ------------ |
| SkillRepository    | The vault, via DataAdapter | Yes          |
| AgentsMdRepository | The vault, via DataAdapter | Yes          |
| SessionRepository  | Nothing. Holds fields      | No           |
| TurnRepository     | Nothing. Holds fields      | No           |

The search classes are repositories in everything but name: NoteGlob, NoteGrep
and NoteReader read the vault and return values, holding no state.

## Where the layers are clean

Commands and Search read as a layered slice: a runner and a catalogue over a
registry, a glob and a grep over the vault. Nothing in either package holds
state across a call.

Engine is where the model breaks down, which is the subject of the next file.
