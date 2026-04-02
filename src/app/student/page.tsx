import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"

export default async function StudentDashboard() {
  const session = await auth()

  // Fetch all published quizzes and include the student's attempts
  const publishedQuizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    include: {
      attempts: {
        where: { studentId: session?.user?.id }
      },
      _count: {
        select: { questions: true }
      }
    },
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
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20 border-dashed">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-4xl">😴</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No quizzes available</h3>
            <p className="text-muted-foreground max-w-sm">
              There are no assigned quizzes for you to take right now. Check back later or ask your instructor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedQuizzes.map((quiz) => {
              const attempt = quiz.attempts[0] // Student's attempt (if they took it)
              const hasAttempted = !!attempt
              const isPending = hasAttempted && attempt.status === 'SUBMITTED'

              return (
                <div key={quiz.id} className="p-6 rounded-lg border shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{quiz.title}</h3>
                    {hasAttempted && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {isPending ? 'Pending' : 'Completed'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                    {quiz.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t">
                    <span className="text-sm font-medium">
                      {isPending ? (
                        <span className="text-muted-foreground italic">Awaiting Evaluation</span>
                      ) : hasAttempted ? (
                        <>Best Score: <span className="font-bold text-primary">{Math.max(...quiz.attempts.map(a => a.score || 0))} pts</span></>
                      ) : (
                        <>{quiz._count.questions} Questions</>
                      )}
                    </span>
                    
                    <Link href={`/student/quiz/${quiz.id}`}>
                      {hasAttempted ? (
                        <Button variant="secondary">{isPending ? 'View Status' : 'View Attempts'}</Button>
                      ) : (
                        <Button>Start Exam</Button>
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
