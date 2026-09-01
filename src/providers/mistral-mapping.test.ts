import { describe, expect, it } from 'vitest'
import { MistralMapping } from './mistral-mapping'

describe('MistralMapping', () => {
  describe('when naming the uploaded audio file', () => {
    it('names the file with the mp4 extension when the mime type is audio/mp4', () => {
      expect(MistralMapping.fileNameFor('audio/mp4')).toBe('utterance.mp4')
    })

    it('names the file with the webm extension when the mime type is audio/webm', () => {
      expect(MistralMapping.fileNameFor('audio/webm')).toBe('utterance.webm')
    })

    it('strips codec parameters when the mime type carries them', () => {
      expect(MistralMapping.fileNameFor('audio/webm;codecs=opus')).toBe('utterance.webm')
    })

    it('falls back to webm when the mime type is empty', () => {
      expect(MistralMapping.fileNameFor('')).toBe('utterance.webm')
    })
  })
})
