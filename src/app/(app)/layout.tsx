import { ViewTransition } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { getAllCourses } from '@/lib/courses'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const courses = await getAllCourses()

  return (
    <>
      <Sidebar courses={courses} />
      <main className="flex-1 min-w-0 lg:ml-[300px]">
        <ViewTransition default="page-crossfade">
          {children}
        </ViewTransition>
      </main>
    </>
  )
}
