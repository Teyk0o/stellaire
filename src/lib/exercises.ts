import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import { visit } from 'unist-util-visit'
import { getCourse } from './courses'

export type ExerciseType = 'qcm' | 'true-false' | 'numeric'

export interface Exercise {
  id: string
  slug: string
  type: ExerciseType
  question: string
  options?: string[]
  correct: string
  tolerance?: string
}

function extractText(node: { type: string; value?: string; children?: unknown[] }): string {
  if (node.type === 'text') return node.value || ''
  if (node.type === 'inlineMath') return `$${node.value}$`
  if (node.type === 'math') return `$$${node.value}$$`
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(c => extractText(c as typeof node)).join('')
  }
  return ''
}

export async function extractExercises(slug: string): Promise<Exercise[]> {
  const course = await getCourse(slug)
  if (!course) return []

  const tree = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .parse(course.content)

  const exercises: Exercise[] = []
  let counter = 0

  visit(tree, (node) => {
    if (node.type !== 'containerDirective' && node.type !== 'leafDirective') return

    const d = node as unknown as { type: string; name?: string; attributes?: Record<string, string>; children?: Array<{ type: string; children?: unknown[]; data?: { directiveLabel?: boolean }; [key: string]: unknown }> }
    const name = d.name
    if (!name || !['qcm', 'true-false', 'numeric'].includes(name)) return

    const attrs = d.attributes || {}
    const children = d.children || []
    counter++
    const id = `${slug}-${name}-${counter}`

    if (name === 'qcm') {
      const listIndex = children.findIndex(c => c.type === 'list')
      const promptNodes = listIndex !== -1 ? children.slice(0, listIndex) : children
      const question = promptNodes
        .filter(c => !c.data?.directiveLabel)
        .map(c => extractText(c as Parameters<typeof extractText>[0]))
        .join(' ')
        .trim()

      let options: string[] = []
      if (listIndex !== -1) {
        const listNode = children[listIndex] as { children: Array<{ children: Array<unknown> }> }
        options = listNode.children.map(li => {
          const p = li.children?.[0]
          if (!p) return ''
          return extractText(p as Parameters<typeof extractText>[0]).replace(/^\[[ x]\]\s*/, '')
        })
      }

      exercises.push({
        id, slug,
        type: 'qcm',
        question,
        options,
        correct: attrs.correct || '0',
      })
    } else if (name === 'true-false') {
      const question = children
        .filter(c => !c.data?.directiveLabel)
        .map(c => extractText(c as Parameters<typeof extractText>[0]))
        .join(' ')
        .trim()

      exercises.push({
        id, slug,
        type: 'true-false',
        question,
        correct: attrs.answer || 'true',
      })
    } else if (name === 'numeric') {
      const question = children
        .filter(c => !c.data?.directiveLabel)
        .map(c => extractText(c as Parameters<typeof extractText>[0]))
        .join(' ')
        .trim()

      exercises.push({
        id, slug,
        type: 'numeric',
        question,
        correct: attrs.answer || '0',
        tolerance: attrs.tolerance,
      })
    }
  })

  return exercises
}
