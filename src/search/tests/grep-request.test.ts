import { describe, expect, it } from 'vitest'
import { GrepRequest } from '../models/grep-request'

const WEEK = '1 - Journal/Weekly/Week-35'
const FRIDAY = `${WEEK}/04-09-Fri.md`

const aRequest = (pathPattern: string | null, paths: readonly string[] = []): GrepRequest =>
  new GrepRequest('roofing', pathPattern, paths, false)

describe('GrepRequest', () => {
  describe('when neither narrowing is given', () => {
    it('admits every path when nothing narrows it', () => {
      expect(aRequest(null).admits(FRIDAY)).toBe(true)
    })

    it('narrows nothing when neither narrowing is given', () => {
      expect(aRequest(null).narrows()).toBe(false)
    })
  })

  describe('when a path pattern narrows it', () => {
    it('admits a path the pattern matches', () => {
      expect(aRequest(`${WEEK}/*.md`).admits(FRIDAY)).toBe(true)
    })

    it('refuses a path the pattern misses', () => {
      expect(aRequest('Quotes/*.md').admits(FRIDAY)).toBe(false)
    })

    it('narrows when a path pattern is given', () => {
      expect(aRequest('Quotes/*.md').narrows()).toBe(true)
    })
  })

  describe('when a paths list narrows it', () => {
    it('admits a path the list names', () => {
      expect(aRequest(null, [FRIDAY]).admits(FRIDAY)).toBe(true)
    })

    it('refuses a path the list omits', () => {
      expect(aRequest(null, ['Quotes/roofing.md']).admits(FRIDAY)).toBe(false)
    })

    it('admits every path when the list is empty, so an empty list is no filter', () => {
      expect(aRequest(null, []).admits(FRIDAY)).toBe(true)
    })

    it('narrows nothing when the list is empty', () => {
      expect(aRequest(null, []).narrows()).toBe(false)
    })
  })

  describe('when both narrowings are given', () => {
    it('admits a path both narrowings allow', () => {
      expect(aRequest(`${WEEK}/*.md`, [FRIDAY]).admits(FRIDAY)).toBe(true)
    })

    it('refuses a path the pattern allows and the list omits', () => {
      expect(aRequest(`${WEEK}/*.md`, ['Quotes/roofing.md']).admits(FRIDAY)).toBe(false)
    })

    it('refuses a path the list names and the pattern misses', () => {
      expect(aRequest('Quotes/*.md', [FRIDAY]).admits(FRIDAY)).toBe(false)
    })
  })
})
