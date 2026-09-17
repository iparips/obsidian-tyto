import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntryProgress } from '../EntryProgress'
import { ProgressLine } from '../../models/panel-state'

const aStep = (
  label: string,
  detail: string,
  refused = false,
  note: string | null = null,
  wroteDirect = false,
): ProgressLine => ({
  label,
  detail,
  refused,
  note,
  wroteDirect,
})

describe('EntryProgress', () => {
  describe('when the turn refused nothing', () => {
    it('counts the steps in the summary when several ran', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk'), aStep('Read', '')]} target={null} />)

      expect(screen.getByText('2 steps')).toBeTruthy()
    })

    it('uses the singular when one step ran', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk')]} target={null} />)

      expect(screen.getByText('1 step')).toBeTruthy()
    })
  })

  describe('when the turn refused a call', () => {
    it('counts the refusals in the summary, since that is why the list is opened', () => {
      render(
        <EntryProgress
          lines={[aStep('Searched', 'milk'), aStep('Refused', 'cap', true)]}
          target={null}
        />,
      )

      expect(screen.getByText('2 steps, 1 refused')).toBeTruthy()
    })

    it('marks the refused row so it stands out from the muted rest', () => {
      const { container } = render(
        <EntryProgress lines={[aStep('Refused', 'cap', true)]} target={null} />,
      )

      expect(container.querySelector('.tyto-progress-refused')).not.toBeNull()
    })

    it('leaves an ordinary row unmarked', () => {
      const { container } = render(
        <EntryProgress lines={[aStep('Searched', 'milk')]} target={null} />,
      )

      expect(container.querySelector('.tyto-progress-refused')).toBeNull()
    })
  })

  describe('when the list is rendered', () => {
    it('renders a row per step in the order they ran', () => {
      render(
        <EntryProgress
          lines={[aStep('Searched', 'milk'), aStep('Grepped', 'eggs')]}
          target={null}
        />,
      )

      const rows = screen.getByLabelText('What the turn did').querySelectorAll('li')

      expect([...rows].map((row) => row.textContent)).toEqual(['Searchedmilk', 'Greppedeggs'])
    })
  })

  // The turn names its target at the top, so only a line acting elsewhere has
  // news worth a name (D2).
  describe('when a line names the note it acted on', () => {
    const noteIn = (container: HTMLElement) =>
      container.querySelector('.tyto-progress-note')?.textContent ?? null

    it('names no note when the line acted on the turns target', () => {
      const { container } = render(
        <EntryProgress
          lines={[aStep('Read', '', false, 'Lists/shopping.md')]}
          target="Lists/shopping.md"
        />,
      )

      expect(noteIn(container)).toBeNull()
    })

    it('names the note when the line acted on another', () => {
      const { container } = render(
        <EntryProgress
          lines={[aStep('Read', '', false, 'Lists/todo.md')]}
          target="Lists/shopping.md"
        />,
      )

      expect(noteIn(container)).toBe('Lists/todo.md')
    })

    it('names none when the line touched no note at all', () => {
      const { container } = render(
        <EntryProgress
          lines={[aStep('Globbed', 'Lists/* — 2 notes')]}
          target="Lists/shopping.md"
        />,
      )

      expect(noteIn(container)).toBeNull()
    })

    // An unbound session has no target to match, so a line that touched a note
    // has news and says it.
    it('names every line that carries a note when the turn is on none', () => {
      const { container } = render(
        <EntryProgress lines={[aStep('Read', '', false, 'Lists/todo.md')]} target={null} />,
      )

      expect(noteIn(container)).toBe('Lists/todo.md')
    })
  })

  // A write that went to the file costs the cursor and may cost undo, and the
  // user needs to know which edit and which note rather than reading a warning
  // below the list that names neither.
  describe('when an edit went straight to the file', () => {
    const directEdit = () => aStep('Edit', 'applied', false, 'Lists/shopping.md', true)

    it('says the write did not go through the editor', () => {
      const { container } = render(
        <EntryProgress lines={[directEdit()]} target="Lists/shopping.md" />,
      )

      expect(container.querySelector('.tyto-progress-direct')?.textContent?.trim()).toBe(
        'Undo not available - because editor moved to another note',
      )
    })

    // The rule that hides a matching note is overridden here: this is the edit
    // the user may have to undo by hand, so it names where it landed.
    it('names the note even where it matches the turns target', () => {
      const { container } = render(
        <EntryProgress lines={[directEdit()]} target="Lists/shopping.md" />,
      )

      expect(container.querySelector('.tyto-progress-note')?.textContent).toBe('Lists/shopping.md')
    })

    // The spans abut in the markup and are spaced by margins, so the assertion
    // reads the parts rather than one string with whitespace it does not have.
    it('reads as one sentence, with only the warning set apart', () => {
      const { container } = render(
        <EntryProgress lines={[directEdit()]} target="Lists/shopping.md" />,
      )

      expect(
        [...(container.querySelector('li')?.children ?? [])].map((at) => at.textContent),
      ).toEqual([
        'Edit',
        'applied',
        'directly.',
        'Undo not available - because editor moved to another note',
        'Lists/shopping.md',
      ])
    })

    it('leaves an edit through the editor unmarked', () => {
      const { container } = render(
        <EntryProgress
          lines={[aStep('Edit', 'applied', false, 'Lists/shopping.md')]}
          target="Lists/shopping.md"
        />,
      )

      expect(container.querySelector('.tyto-progress-direct')).toBeNull()
    })

    it('counts no refusal for it, since the write worked', () => {
      render(<EntryProgress lines={[directEdit()]} target="Lists/shopping.md" />)

      expect(screen.getByText('1 step')).toBeTruthy()
    })
  })
})
