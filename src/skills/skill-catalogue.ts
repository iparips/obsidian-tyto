export interface Skill {
  name: string
  description: string
  path: string
}

// Descriptions are held, bodies are not: prompt cost scales with skill count,
// not skill size (NFR6).
export type SkillCatalogue = readonly Skill[]

export const EMPTY_CATALOGUE: SkillCatalogue = []
