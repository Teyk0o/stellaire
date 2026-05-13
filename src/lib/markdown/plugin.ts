import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

interface DirectiveNode {
  type: string
  name: string
  attributes?: Record<string, string>
  children: Array<{ type: string; children?: Array<{ type: string; value?: string; children?: unknown[] }>; data?: { directiveLabel?: boolean }; value?: string; [key: string]: unknown }>
  data?: Record<string, unknown>
  [key: string]: unknown
}

const DIRECTIVE_COMPONENTS: Record<string, string> = {
  spoiler: 'Spoiler',
  qcm: 'QCM',
  'qcm-multi': 'QCMMulti',
  numeric: 'NumericInput',
  'fill-blanks': 'FillBlanks',
  order: 'OrderExercise',
  'true-false': 'TrueFalse',
  graph: 'FunctionGraph',
  'unit-circle': 'UnitCircle',
  'vector': 'VectorDecomposition',
  'projectile': 'ProjectileMotion',
  'orbit': 'OrbitSimulation',
  interactive: 'Interactive',
  spatial: 'SpatialCallout',
  attention: 'AttentionCallout',
  info: 'InfoCallout',
  tip: 'TipCallout',
  recap: 'RecapCard',
}

const EXERCISE_DIRECTIVES = new Set(['qcm', 'qcm-multi', 'true-false'])

function extractTextFromNode(node: { type: string; value?: string; children?: Array<{ type: string; value?: string; children?: unknown[] }> }): string {
  if (node.type === 'text') return node.value || ''
  if (node.type === 'inlineMath') return `$${node.value}$`
  if (node.type === 'math') return `$$${node.value}$$`
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(c => extractTextFromNode(c as typeof node)).join('')
  }
  return ''
}

export const remarkDirectiveToMdx: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node) => {
      if (
        node.type !== 'containerDirective' &&
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective'
      ) {
        return
      }

      const d = node as unknown as DirectiveNode
      const componentName = DIRECTIVE_COMPONENTS[d.name]
      if (!componentName) return

      const attributes: Array<{ type: string; name: string; value: string }> = []

      if (d.attributes) {
        for (const [name, value] of Object.entries(d.attributes)) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name,
            value: value,
          })
        }
      }

      if (d.children?.[0]?.data?.directiveLabel) {
        const labelNode = d.children[0]
        const labelText = extractTextFromNode(labelNode as Parameters<typeof extractTextFromNode>[0])
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'label',
          value: labelText,
        })
        d.children = d.children.slice(1)
      }

      if (EXERCISE_DIRECTIVES.has(d.name)) {
        const listIndex = d.children.findIndex(c => c.type === 'list')
        if (listIndex !== -1) {
          const listNode = d.children[listIndex] as { children: Array<{ children: Array<{ type: string; value?: string; children?: unknown[] }> }> }
          const options = listNode.children.map(listItem => {
            const paragraph = listItem.children?.[0]
            if (!paragraph) return ''
            const text = extractTextFromNode(paragraph as Parameters<typeof extractTextFromNode>[0])
            return text.replace(/^\[[ x]\]\s*/, '')
          })

          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'options',
            value: JSON.stringify(options),
          })

          d.children = [
            ...d.children.slice(0, listIndex),
            ...d.children.slice(listIndex + 1),
          ]
        }
      }

      d.type = d.type === 'textDirective' ? 'mdxJsxTextElement' : 'mdxJsxFlowElement'
      d.name = componentName
      ;(d as Record<string, unknown>).attributes = attributes
      d.data = undefined
    })
  }
}
