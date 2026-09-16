import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntryProgress } from '../EntryProgress'
import { ProgressLine } from '../../models/panel-state'

const aStep = (label: string, detail: string, refused = false): ProgressLine => ({
  label,
  detail,
  refused,
})

describe('EntryProgress', () => {
  describe('when the turn refused nothing', () => {
    it('counts the steps in the summary when several ran', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk'), aStep('Read', 'todo.md')]} />)

      expect(screen.getByText('2 steps')).toBeTruthy()
    })

    it('uses the singular when one step ran', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk')]} />)

      expect(screen.getByText('1 step')).toBeTruthy()
    })
  })

  describe('when the turn refused a call', () => {
    it('counts the refusals in the summary, since that is why the list is opened', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk'), aStep('Refused', 'cap', true)]} />)

      expect(screen.getByText('2 steps, 1 refused')).toBeTruthy()
    })

    it('marks the refused row so it stands out from the muted rest', () => {
      const { container } = render(<EntryProgress lines={[aStep('Refused', 'cap', true)]} />)

      expect(container.querySelector('.tyto-progress-refused')).not.toBeNull()
    })

    it('leaves an ordinary row unmarked', () => {
      const { container } = render(<EntryProgress lines={[aStep('Searched', 'milk')]} />)

      expect(container.querySelector('.tyto-progress-refused')).toBeNull()
    })
  })

  describe('when the list is rendered', () => {
    it('renders a row per step in the order they ran', () => {
      render(<EntryProgress lines={[aStep('Searched', 'milk'), aStep('Read', 'todo.md')]} />)

      const rows = screen.getByLabelText('What the turn did').querySelectorAll('li')

      expect([...rows].map((row) => row.textContent)).toEqual(['Searchedmilk', 'Readtodo.md'])
    })
  })
})
