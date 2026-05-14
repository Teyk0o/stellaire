'use client'

import katex from 'katex'

function renderWithKatex(text: string): string {
  return text
    .replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try { return katex.renderToString(math, { throwOnError: false, displayMode: true }) }
      catch { return `$$${math}$$` }
    })
    .replace(/\$([^$]+)\$/g, (_, math) => {
      try { return katex.renderToString(math, { throwOnError: false }) }
      catch { return `$${math}$` }
    })
}

export function KatexLabel({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderWithKatex(text) }} />
}
