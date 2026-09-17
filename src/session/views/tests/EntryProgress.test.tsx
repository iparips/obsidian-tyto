import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntryProgress } from '../EntryProgress'
import { ProgressLine } from '../../models/panel-state'

const aStep = (
  label: string,
  detail: string,
  refused = false,
  note: string | null = null,
): ProgressLine => ({
  label,
  detail,
  refused,
  note,
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

      expect(noteIn(container)).toBe('todo')
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

      expect(noteIn(container)).toBe('todo')
    })
  })
})
