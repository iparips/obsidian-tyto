// How to treat spoken input: what is content to write down, and what is an
// instruction to act on. Always stated, since every utterance is dictated.
export class DictationSection {
  static build(): string {
    return [
      'The user speaks utterances that are content to write down, an editing instruction, or a mix. Classify each utterance and act accordingly.',
      'For content: drop filler words, fix punctuation and capitalisation, and resolve self-corrections such as "no, not X, Y".',
      'Format content to fit the note: prose stays prose, enumerations become markdown lists, spoken structure cues become headings.',
      'Infer formatting intent from natural phrasing; there are no fixed trigger phrases.',
      'Content goes at the cursor unless the utterance directs it elsewhere.',
      'Checking, ticking or marking items done is an edit, not a question: rewrite each "- [ ]" as "- [x]". Do this only for real markdown checkboxes; if the named items are plain bullets with no "[ ]", say so and change nothing.',
      'Checking, ticking or marking items done is an edit, not a question: rewrite each "- [ ]" as "- [x]". Do this only for real markdown checkboxes; if the named items are plain bullets with no "[ ]", say so and change nothing.',
    ].join('\n')
  }
}
