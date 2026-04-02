import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import AttemptReviewClient from "./AttemptReviewClient"

export default async function AttemptDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string, attemptId: string }> 
}) {
  const session = await auth()
  const resolvedParams = await params
  const { id, attemptId } = resolvedParams

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    redirect("/auth/signin")
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      quiz: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { options: true }
          }
        }
      },
      answers: {
        include: { selectedOption: true }
      },
      proctorLogs: {
        orderBy: { timestamp: 'asc' }
      }
    }
  })

  if (!attempt) {
    return <div className="p-8 text-center text-destructive font-bold text-2xl">Attempt not found.</div>
  }

  // Access control
  if (session.user.role === "INSTRUCTOR" && attempt.quiz.instructorId !== session.user.id) {
    return <div className="p-8 text-center text-destructive font-bold text-2xl">Unauthorized.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link href={`/instructor/quizzes/${id}/attempts`} className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
              &larr; Back to Results
            </Link>
            <h1 className="text-3xl font-bold">Attempt Details</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div><span className="font-semibold">Name:</span> {attempt.student.name || "N/A"}</div>
            <div><span className="font-semibold">Email:</span> {attempt.student.email}</div>
            <div><span className="font-semibold">Score:</span> {attempt.score !== null ? `${attempt.score} points` : "Pending"}</div>
            <div>
              <span className="font-semibold">Submitted:</span>{" "}
              {attempt.endTime ? new Date(attempt.endTime).toLocaleString() : "In Progress"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proctoring Log</CardTitle>
            <CardDescription>{attempt.proctorLogs.length} violation(s) detected</CardDescription>
          </CardHeader>
          <CardContent>
            {attempt.proctorLogs.length === 0 ? (
              <div className="text-green-600 font-semibold flex items-center gap-2">
                ✓ No suspicious activity detected.
              </div>
            ) : (
              <ul className="space-y-3">
                {attempt.proctorLogs.map(log => (
                  <li key={log.id} className="text-sm border-l-2 border-destructive pl-3 py-1">
                    <div className="font-semibold text-destructive">{log.eventType}</div>
                    <div className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    {log.details && <div>{log.details}</div>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Grading and Review Client Component */}
      <AttemptReviewClient attempt={attempt} />
    </div>
  )
}