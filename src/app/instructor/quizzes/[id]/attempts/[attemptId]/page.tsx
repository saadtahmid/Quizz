import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MathText } from "@/components/ui/math-text"
import GradeButton from "./GradeButton"

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
          {attempt.status === "SUBMITTED" && (
            <GradeButton attemptId={attemptId} />
          )}
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

      <h2 className="text-2xl font-bold mb-6">Student Answers</h2>
      <div className="flex flex-col gap-6">
        {attempt.quiz.questions.map((question, idx) => {
          const studentAnswer = attempt.answers.find(a => a.questionId === question.id);
          
          return (
            <Card key={question.id}>
              <CardHeader className="border-b bg-muted/30">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  <div>
                    {studentAnswer?.isCorrect === true && <Badge className="bg-green-600">Correct</Badge>}
                    {studentAnswer?.isCorrect === false && <Badge variant="destructive">Incorrect</Badge>}
                    {studentAnswer?.isCorrect === null && <Badge variant="secondary">Needs Review</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 text-lg">
                  {question.mathEnabled ? (
                    <MathText content={question.content} />
                  ) : (
                    <p>{question.content}</p>
                  )}
                </div>

                {question.type === "MCQ" ? (
                  <div className="space-y-3">
                    {question.options.map(opt => {
                      const isSelected = studentAnswer?.selectedOptionId === opt.id;
                      let bgClass = "bg-background";
                      let borderClass = "border-border";
                      
                      if (opt.isCorrect) {
                        bgClass = "bg-green-50 dark:bg-green-950/30";
                        borderClass = "border-green-500";
                      } else if (isSelected && !opt.isCorrect) {
                        bgClass = "bg-red-50 dark:bg-red-950/30";
                        borderClass = "border-red-500";
                      }

                      return (
                        <div key={opt.id} className={`p-4 border rounded-md flex items-center gap-3 ${bgClass} ${borderClass}`}>
                          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div className="w-full">
                            {opt.mathEnabled ? <MathText content={opt.text} /> : opt.text}
                          </div>
                          {opt.isCorrect && <Badge variant="outline" className="ml-auto text-green-600 border-green-600 flex-shrink-0">Correct Answer</Badge>}
                          {isSelected && !opt.isCorrect && <Badge variant="outline" className="ml-auto text-destructive border-destructive flex-shrink-0">Student Answer</Badge>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-semibold mb-2">Student&apos;s Response:</div>
                    <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap border">
                      {studentAnswer?.textAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
                    </div>
                    {studentAnswer?.aiFeedback && (
                      <div className="mt-4 p-4 rounded-md border bg-blue-500/10 border-blue-500/20">
                        <div className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">AI Grader Feedback:</div>
                        <div className="text-blue-900 dark:text-blue-200">{studentAnswer.aiFeedback}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
