import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntryText } from '../EntryText'

describe('EntryText', () => {
  describe('when no renderer is supplied', () => {
    it('prints the text as it stands, so a panel without a vault still reads', () => {
      render(<EntryText text="Added to the **Top Ups** section" />)

      expect(screen.getByText('Added to the **Top Ups** section')).toBeTruthy()
    })
  })

  describe('when a renderer is supplied', () => {
    it('hands the markdown to the renderer rather than printing it', () => {
      const renderMarkdownFn = vi.fn().mockReturnValue(() => {})

      render(
        <EntryText text="Added to the **Top Ups** section" renderMarkdownFn={renderMarkdownFn} />,
      )

      expect(renderMarkdownFn).toHaveBeenCalledWith(
        'Added to the **Top Ups** section',
        expect.anything(),
      )
    })

    it('leaves the source out of the panel, so the asterisks never show', () => {
      const renderMarkdownFn = vi.fn().mockReturnValue(() => {})

      render(
        <EntryText text="Added to the **Top Ups** section" renderMarkdownFn={renderMarkdownFn} />,
      )

      expect(screen.queryByText('Added to the **Top Ups** section')).toBeNull()
    })

    // The renderer appends, so a re-render on new text would otherwise leave
    // the old entry above the new one.
    it('clears what it rendered before rendering again', () => {
      const renderMarkdownFn = vi.fn((markdown: string, into: HTMLElement) => {
        into.appendChild(document.createTextNode(markdown))
        return () => {}
      })
      const { rerender } = render(<EntryText text="first" renderMarkdownFn={renderMarkdownFn} />)

      rerender(<EntryText text="second" renderMarkdownFn={renderMarkdownFn} />)

      expect(screen.queryByText('first')).toBeNull()
      expect(screen.getByText('second')).toBeTruthy()
    })

    it('runs the cleanup when the entry leaves, so its render children go with it', () => {
      const cleanup = vi.fn()
      const renderMarkdownFn = vi.fn().mockReturnValue(cleanup)
      const { unmount } = render(<EntryText text="a reply" renderMarkdownFn={renderMarkdownFn} />)

      unmount()

      expect(cleanup).toHaveBeenCalled()
    })
  })
})
