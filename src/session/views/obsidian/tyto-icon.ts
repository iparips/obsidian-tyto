import { addIcon } from 'obsidian'
import { TYTO_OWL_PATHS } from '../TytoOwl'

export const TYTO_ICON = 'tyto-owl'

// Obsidian wraps custom markup in its own svg on a 0 0 100 100 viewBox, so it
// takes the shared paths bare, the way TytoOwl's own wrapper takes them.
//
// Called first in onload: a site naming an unregistered icon renders nothing.
export const registerTytoIcon = (): void => addIcon(TYTO_ICON, TYTO_OWL_PATHS)
