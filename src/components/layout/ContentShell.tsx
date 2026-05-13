import type { ReactNode } from 'react'

export function ContentShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[720px] mx-auto px-6 pt-16 lg:pt-12 w-full" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)' }}>
      {children}
    </div>
  )
}
