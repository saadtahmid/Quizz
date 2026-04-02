import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function InstructorDashboard() {
  const session = await auth()

  const quizzes = await prisma.quiz.findMany({
    where: { instructorId: session?.user?.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Welcome, {session?.user?.name || session?.user?.email}</span>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Quizzes</h2>
          <Link href="/instructor/quizzes/new">
            <Button>Create New Quiz</Button>
          </Link>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-4">You haven&apos;t created any quizzes yet.</p>
            <Link href="/instructor/quizzes/new">
              <Button variant="outline">Create your first quiz</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 rounded-lg border shadow-sm flex flex-col">
                <h3 className="text-lg font-bold mb-2">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                  {quiz.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    {quiz.isPublished ? "🟢 Published" : "🟡 Draft"}
                  </span>
                  <Link href={`/instructor/quizzes/${quiz.id}`}>
                    <Button variant="secondary" size="sm">Manage</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
