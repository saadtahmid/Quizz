import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function QuizAttemptsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const resolvedParams = await params
  const { id } = resolvedParams

  if (!session || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
    redirect("/auth/signin")
  }

  // Fetch quiz and attempts
  const quiz = await prisma.quiz.findUnique({
    where: { id: id },
    include: {
      attempts: {
        orderBy: { endTime: 'desc' },
        include: {
          student: true,
          proctorLogs: true,
          answers: true
        }
      }
    }
  })

  if (!quiz) {
    return <div className="p-8 text-center text-destructive font-bold text-2xl">Quiz not found.</div>
  }

  // Access control
  if (session.user.role === "INSTRUCTOR" && quiz.instructorId !== session.user.id) {
    return <div className="p-8 text-center text-destructive font-bold text-2xl">Unauthorized access to this quiz.</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <Link href="/instructor" className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Results: {quiz.title}</h1>
        <p className="text-muted-foreground mt-1">Review student attempts, scores, and proctoring logs.</p>
      </div>

      {quiz.attempts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No students have taken this quiz yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
            <CardDescription>{quiz.attempts.length} total attempt(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Integrity Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quiz.attempts.map((attempt) => {
                  const violationCount = attempt.proctorLogs.length;
                  return (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div className="font-medium">{attempt.student.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{attempt.student.email}</div>
                      </TableCell>
                      <TableCell>
                        {attempt.endTime ? new Date(attempt.endTime).toLocaleString() : "In Progress"}
                      </TableCell>
                      <TableCell className="font-semibold text-lg">
                        {attempt.score !== null ? attempt.score : "Pending"}
                      </TableCell>
                      <TableCell>
                        {violationCount === 0 ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">Clean</Badge>
                        ) : (
                          <Badge variant="destructive">{violationCount} Violation(s)</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/instructor/quizzes/${quiz.id}/attempts/${attempt.id}`}>
                          <Button variant="outline" size="sm">
                            Review Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
