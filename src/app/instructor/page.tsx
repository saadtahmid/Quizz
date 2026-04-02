import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="secondary">Go to Admin Dashboard</Button>
            </Link>
          )}
          <span>Welcome, {session?.user?.name || session?.user?.email}</span>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <Button type="submit" variant="outline">Sign Out</Button>
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
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 border-dashed">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You haven&apos;t created any quizzes. Get started by creating your first exam to test your students&apos; knowledge.
            </p>
            <Link href="/instructor/quizzes/new">
              <Button size="lg">Create your first quiz</Button>
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
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server"
                      await prisma.quiz.delete({ where: { id: quiz.id } })
                      revalidatePath('/instructor')
                    }}>
                      <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:bg-destructive/10">Delete</Button>
                    </form>
                    <Link href={`/instructor/quizzes/${quiz.id}/attempts`}>
                      <Button variant="outline" size="sm">Results</Button>
                    </Link>
                    <Link href={`/instructor/quizzes/${quiz.id}`}>
                      <Button variant="secondary" size="sm">Manage</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
