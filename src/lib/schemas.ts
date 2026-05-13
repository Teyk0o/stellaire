import { z } from 'zod'

export const subjectSchema = z.enum(['math', 'physics', 'chemistry'])

export const frontmatterSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  phase: z.number().int().positive('La phase doit être un entier positif'),
  subject: subjectSchema,
  order: z.number().int().nonnegative('L\'ordre doit être un entier positif ou nul'),
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
})

export const courseProgressSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed', 'mastered']),
  lastOpened: z.string().optional(),
  completedAt: z.string().optional(),
  completedExercises: z.array(z.string()).default([]),
  exerciseResults: z.record(z.string(), z.object({
    correct: z.boolean(),
    attempts: z.number(),
  })).default({}),
  revisions: z.array(z.object({
    date: z.string(),
    score: z.number(),
    passed: z.boolean(),
  })).default([]),
  nextRevision: z.string().optional(),
})

export const progressDataSchema = z.record(z.string(), courseProgressSchema)

export type Frontmatter = z.infer<typeof frontmatterSchema>
