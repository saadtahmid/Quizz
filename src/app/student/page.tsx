import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function StudentDashboard() {
  const session = await auth()

  // Fetch all published quizzes
  const publishedQuizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="flex items-center gap-4">
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
        <h2 className="text-2xl font-semibold mb-4">Available Quizzes</h2>
        
        {publishedQuizzes.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">There are no quizzes available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedQuizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 rounded-lg border shadow-sm flex flex-col">
                <h3 className="text-lg font-bold mb-2">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                  {quiz.description || "No description provided."}
                </p>
                <div className="flex items-center justify-end mt-auto pt-4 border-t">
                  <Link href={`/student/quiz/${quiz.id}`}>
                    <Button>Start Exam</Button>
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
