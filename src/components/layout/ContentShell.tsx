import type { ReactNode } from 'react'

export function ContentShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-12 w-full">
      {children}
    </div>
  )
}
