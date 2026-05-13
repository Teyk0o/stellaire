import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unstable_noStore } from 'next/cache'
import { frontmatterSchema } from './schemas'
import type { CourseMeta, CourseData, CourseGroup, Subject } from '@/types/course'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function getSlugFromFilename(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '')
}

export async function getAllCourses(): Promise<CourseMeta[]> {
  if (process.env.NODE_ENV === 'development') {
    unstable_noStore()
  }

  const courses: CourseMeta[] = []
  const slugs = new Set<string>()

  const phases = fs.readdirSync(CONTENT_DIR).filter(d =>
    d.startsWith('phase-') && fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  )

  for (const phaseDir of phases) {
    const phasePath = path.join(CONTENT_DIR, phaseDir)
    const subjects = fs.readdirSync(phasePath).filter(d =>
      fs.statSync(path.join(phasePath, d)).isDirectory()
    )

    for (const subjectDir of subjects) {
      const subjectPath = path.join(phasePath, subjectDir)
      const files = fs.readdirSync(subjectPath).filter(f => f.endsWith('.md'))

      for (const file of files) {
        const filePath = path.join(subjectPath, file)
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data } = matter(raw)

        const result = frontmatterSchema.safeParse(data)
        if (!result.success) {
          console.error(`[Stellaire] Frontmatter invalide dans ${filePath}:`)
          for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
          }
          continue
        }

        const slug = getSlugFromFilename(file)
        if (slugs.has(slug)) {
          console.error(`[Stellaire] Slug dupliqué "${slug}" dans ${filePath}`)
          continue
        }
        slugs.add(slug)

        courses.push({
          ...result.data,
          slug,
        })
      }
    }
  }

  return courses.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject)
    return a.order - b.order
  })
}

export async function getCourse(slug: string): Promise<CourseData | null> {
  if (process.env.NODE_ENV === 'development') {
    unstable_noStore()
  }

  const courses = await findCourseFile(slug)
  return courses
}

async function findCourseFile(slug: string): Promise<CourseData | null> {
  const phases = fs.readdirSync(CONTENT_DIR).filter(d =>
    d.startsWith('phase-') && fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  )

  for (const phaseDir of phases) {
    const phasePath = path.join(CONTENT_DIR, phaseDir)
    const subjects = fs.readdirSync(phasePath).filter(d =>
      fs.statSync(path.join(phasePath, d)).isDirectory()
    )

    for (const subjectDir of subjects) {
      const subjectPath = path.join(phasePath, subjectDir)
      const files = fs.readdirSync(subjectPath).filter(f => f.endsWith('.md'))

      for (const file of files) {
        const fileSlug = getSlugFromFilename(file)
        if (fileSlug !== slug) continue

        const filePath = path.join(subjectPath, file)
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)

        const result = frontmatterSchema.safeParse(data)
        if (!result.success) {
          console.error(`[Stellaire] Frontmatter invalide dans ${filePath}:`)
          for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
          }
          return null
        }

        return {
          meta: { ...result.data, slug },
          content,
        }
      }
    }
  }

  return null
}

export async function getCourseGroups(): Promise<CourseGroup[]> {
  const courses = await getAllCourses()
  const groupMap = new Map<number, Record<Subject, CourseMeta[]>>()

  for (const course of courses) {
    if (!groupMap.has(course.phase)) {
      groupMap.set(course.phase, { math: [], physics: [], chemistry: [] })
    }
    groupMap.get(course.phase)![course.subject].push(course)
  }

  return Array.from(groupMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([phase, subjects]) => ({ phase, subjects }))
}
