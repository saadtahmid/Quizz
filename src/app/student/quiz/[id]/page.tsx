"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MathText } from "@/components/ui/math-text"
import { CheckCircle2, XCircle } from "lucide-react"

export default function StudentQuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<any[]>([])
  const [quizData, setQuizData] = useState<any>(null)
  const [viewAttemptIdx, setViewAttemptIdx] = useState(0)

  useEffect(() => {
    async function fetchAttempts() {
      try {
        const res = await fetch(`/api/student/quizzes/${quizId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        
        setQuizData(data)
        if (data.attempts && data.attempts.length > 0) {
          setAttempts(data.attempts)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (quizId) fetchAttempts()
  }, [quizId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-20">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-20 w-3/4 mx-auto mb-8" />
        <Skeleton className="h-10 w-40 mx-auto" />
      </div>
    )
  }

  if (attempts.length > 0) {
    const attempt = attempts[viewAttemptIdx];
    
    if (attempt.status === 'SUBMITTED') {
      return (
        <div className="max-w-4xl mx-auto p-8 mt-12 mb-20 text-center">
          <div className="border rounded-lg shadow-sm p-12 bg-card">
            <h1 className="text-3xl font-bold mb-4">Exam Submitted</h1>
            <p className="text-muted-foreground mb-6">
              You have successfully submitted your answers for <strong>{quizData?.title}</strong>.
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-8 rounded-lg mb-8 inline-block">
              <span className="text-lg font-medium text-yellow-800 dark:text-yellow-400">
                ⏳ Pending Instructor Evaluation
              </span>
              <p className="text-sm text-yellow-700/70 dark:text-yellow-500/70 mt-2 max-w-sm">
                Your exam contains questions that require manual or AI-assisted grading by your instructor. Check back later to see your final score and detailed review.
              </p>
            </div>
  
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push("/student")}>
                &larr; Back to Dashboard
              </Button>
              <Button onClick={() => router.push(`/student/quiz/${quizId}/take`)}>
                Take Exam Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-4xl mx-auto p-8 mt-12 mb-20">
        <div className="text-center border rounded-lg shadow-sm p-12 bg-card mb-8">
          <h1 className="text-3xl font-bold mb-4">Exam Completed: {quizData?.title}</h1>
          <p className="text-muted-foreground mb-6">
            You have completed this exam {attempts.length} time(s).
          </p>

          {attempts.length > 1 && (
            <div className="flex justify-center gap-2 mb-6">
              {attempts.map((_, idx) => (
                <Button 
                  key={idx} 
                  variant={viewAttemptIdx === idx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewAttemptIdx(idx)}
                >
                  Attempt {attempts.length - idx}
                </Button>
              ))}
            </div>
          )}
          
          <div className="bg-background border p-8 rounded-lg mb-8 inline-block min-w-48">
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground block mb-2">Score (Attempt {attempts.length - viewAttemptIdx})</span>
            <div className="text-5xl font-black text-primary">
              {attempt?.score} <span className="text-xl text-muted-foreground">pts</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/student")}>
              &larr; Back to Dashboard
            </Button>
            <Button onClick={() => router.push(`/student/quiz/${quizId}/take`)}>
              Retake Exam
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Detailed Review</h2>
          {quizData?.questions.map((q: any, i: number) => {
            const studentAns = attempt?.answers?.find((a: any) => a.questionId === q.id)
            const isCorrect = studentAns?.isCorrect

            return (
              <div key={q.id} className="border rounded-lg p-6 bg-card relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  isCorrect === true ? 'bg-green-500' : isCorrect === false ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                
                <div className="flex justify-between items-start mb-4 pl-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Question {i + 1}
                    {isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {isCorrect === false && <XCircle className="w-5 h-5 text-red-500" />}
                  </h3>
                  <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
                    {studentAns?.manualScore ?? 0} / {q.points} pts
                  </span>
                </div>

                <div className="pl-4 mb-6">
                  {q.mathEnabled ? <MathText content={q.content} /> : <p>{q.content}</p>}
                </div>

                <div className="pl-4">
                  {q.type === "MCQ" ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Options:</p>
                      {q.options.map((opt: any) => {
                        const isSelected = studentAns?.selectedOptionId === opt.id
                        const isActuallyCorrect = opt.isCorrect

                        let borderClass = "border-border bg-background"
                        if (isActuallyCorrect) borderClass = "border-green-500 bg-green-500/10"
                        else if (isSelected && !isActuallyCorrect) borderClass = "border-red-500 bg-red-500/10"

                        return (
                          <div key={opt.id} className={`p-4 rounded-md border ${borderClass} flex items-center justify-between`}>
                            <div>
                              {q.mathEnabled || opt.mathEnabled ? <MathText content={opt.text} /> : <span>{opt.text}</span>}
                            </div>
                            <div className="flex gap-2">
                              {isSelected && <span className="text-xs font-bold bg-background border px-2 py-1 rounded">Your Answer</span>}
                              {isActuallyCorrect && <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded">Correct Answer</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</p>
                        <div className="p-4 rounded-md border bg-muted/50 whitespace-pre-wrap">
                          {studentAns?.textAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
                        </div>
                      </div>
                      
                      {studentAns?.aiFeedback && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">AI Grader Feedback:</p>
                          <div className="p-4 rounded-md border bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200">
                            {studentAns.aiFeedback}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">Exam Ready: {quizData?.title}</h1>
      <p className="text-muted-foreground mb-8">
        You are about to start the exam. Ensure you are in a quiet environment. <br />
        <span className="font-semibold text-destructive">
          Once you start, leaving the tab, switching windows, or trying to copy text will be logged as an integrity violation!
        </span>
      </p>
      
      {quizData?.timeLimit && (
        <div className="mb-8 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg inline-block">
          <p className="font-bold text-lg">⏳ Time Limit: {quizData.timeLimit} Minutes</p>
          <p className="text-sm">The exam will automatically submit when the timer runs out.</p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/student")}>
          Cancel
        </Button>
        <Button onClick={() => router.push(`/student/quiz/${quizId}/take`)}>
          I understand, Start Exam
        </Button>
      </div>
    </div>
  )
}
