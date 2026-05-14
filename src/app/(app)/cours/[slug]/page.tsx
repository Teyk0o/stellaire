import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { getCourse, getAllCourses } from '@/lib/courses'
import { remarkDirectiveToMdx } from '@/lib/markdown/plugin'
import { directiveComponents } from '@/lib/markdown/components'
import { ContentShell } from '@/components/layout/ContentShell'
import { ProgressProvider } from '@/components/course/ProgressContext'
import { CourseCompletion } from '@/components/course/CourseCompletion'
import type { CourseMeta, Subject } from '@/types/course'

const subjectLabels: Record<Subject, string> = {
  math: 'Mathématiques',
  physics: 'Physique',
  chemistry: 'Chimie',
}

export const dynamicParams = true
export const dynamic = 'force-dynamic'

function CourseHeader({ meta }: { meta: CourseMeta }) {
  return (
    <div className="mb-8 pb-6 border-b border-foreground/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
          Phase {meta.phase}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-foreground/5 text-secondary">
          {subjectLabels[meta.subject]}
        </span>
      </div>
      <h1 className="text-3xl font-bold">{meta.title}</h1>
    </div>
  )
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)

  if (!course) notFound()

  const allCourses = await getAllCourses()
  const sameCourses = allCourses
    .filter(c => c.phase === course.meta.phase && c.subject === course.meta.subject && !c.tags.includes('demo'))
    .sort((a, b) => a.order - b.order)
  const currentIndex = sameCourses.findIndex(c => c.slug === slug)
  const nextCourse = currentIndex >= 0 && currentIndex < sameCourses.length - 1
    ? sameCourses[currentIndex + 1]
    : null

  return (
    <ContentShell>
      <CourseHeader meta={course.meta} />
      <ProgressProvider slug={slug}>
        <article className="prose">
          <MDXRemote
            source={course.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveToMdx, remarkMath],
                rehypePlugins: [rehypeKatex],
              },
            }}
            components={directiveComponents}
          />
        </article>
        <CourseCompletion slug={slug} nextCourse={nextCourse} />
      </ProgressProvider>
    </ContentShell>
  )
}
