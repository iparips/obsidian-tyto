import { beforeEach, describe, expect, it } from 'vitest'
import { REGISTERED_ICONS } from '../../../../test-support/__mocks__/obsidian'
import { TYTO_OWL_PATHS } from '../../TytoOwl'
import { registerTytoIcon, TYTO_ICON } from '../tyto-icon'

// The glyph itself is checked by eye in the ribbon, which is the only place it
// renders at 18 pixels. What a suite can hold are the invariants that make it
// render at all: registered under the name the call sites use, drawn in the
// theme's colour, and carrying no wrapper Obsidian would nest inside its own.
describe('registerTytoIcon', () => {
  let markup: string

  beforeEach(() => {
    REGISTERED_ICONS.clear()

    registerTytoIcon()

    markup = REGISTERED_ICONS.get(TYTO_ICON) ?? ''
  })

  it('registers the glyph under the name the call sites ask for', () => {
    expect(REGISTERED_ICONS.has(TYTO_ICON)).toBe(true)
  })

  it('draws every shape in currentColor so the glyph follows the theme', () => {
    expect(markup).not.toMatch(/#[0-9a-f]{3,6}/i)
  })

  it('carries no svg wrapper, since Obsidian supplies one and its viewBox', () => {
    expect(markup).not.toMatch(/<svg|viewBox/)
  })

  it('registers the shared paths, so the ribbon and the header draw one mark', () => {
    expect(markup).toBe(TYTO_OWL_PATHS)
  })
})
