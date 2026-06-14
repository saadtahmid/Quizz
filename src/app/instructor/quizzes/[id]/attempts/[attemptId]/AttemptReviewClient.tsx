"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MathText } from "@/components/ui/math-text"
import { toast } from "sonner"
import { CheckCircle, Download, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AttemptReviewClient({ attempt }: { attempt: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const importInputRef = useRef<HTMLInputElement>(null)

  // Initialize scores state for TEXT answers
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    attempt.answers.forEach((ans: any) => {
      if (ans.question.type === "TEXT") {
        initial[ans.id] = ans.manualScore || 0
      }
    })
    return initial
  })

  // Per-answer feedback (explaining the intended answer), keyed by answer id.
  const [feedback, setFeedback] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    attempt.answers.forEach((ans: any) => {
      if (ans.question.type === "TEXT") {
        initial[ans.id] = ans.aiFeedback || ""
      }
    })
    return initial
  })

  const handleScoreChange = (answerId: string, value: string, maxPoints: number) => {
    let num = parseFloat(value)
    if (isNaN(num)) num = 0
    if (num > maxPoints) num = maxPoints
    if (num < 0) num = 0
    setScores(prev => ({ ...prev, [answerId]: num }))
  }

  const handleFeedbackChange = (answerId: string, value: string) => {
    setFeedback(prev => ({ ...prev, [answerId]: value }))
  }

  // Import an LLM evaluation produced from the downloaded transcript. It is
  // keyed by questionId, so we map each entry back to the matching answer and
  // pre-fill the score + feedback fields for the instructor to review.
  const handleImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const evaluations = Array.isArray(parsed) ? parsed : parsed?.evaluations
      if (!Array.isArray(evaluations)) {
        throw new Error("Missing 'evaluations' array")
      }

      const nextScores: Record<string, number> = {}
      const nextFeedback: Record<string, string> = {}
      let applied = 0

      for (const ev of evaluations) {
        const question = attempt.quiz.questions.find((q: any) => q.id === ev?.questionId)
        if (!question || question.type !== "TEXT") continue
        const answer = attempt.answers.find((a: any) => a.questionId === question.id)
        if (!answer) continue

        if (typeof ev.awardedMarks === "number") {
          const clamped = Math.min(Math.max(ev.awardedMarks, 0), question.points)
          nextScores[answer.id] = clamped
        }
        if (typeof ev.feedback === "string") {
          nextFeedback[answer.id] = ev.feedback
        }
        applied++
      }

      if (applied === 0) {
        toast.error("No matching questions found in this evaluation")
        return
      }

      setScores(prev => ({ ...prev, ...nextScores }))
      setFeedback(prev => ({ ...prev, ...nextFeedback }))
      toast.success(`Imported evaluation for ${applied} question(s). Review and finalize.`)
    } catch (error) {
      console.error(error)
      toast.error("Could not read evaluation file. Expecting transcript evaluation JSON.")
    }
  }

  const handleFinalize = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/attempts/${attempt.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, feedback })
      })
      if (!res.ok) throw new Error("Failed to finalize")
      
      const data = await res.json()
      toast.success(`Attempt finalized! Final score is ${data.newScore}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to finalize attempt")
    } finally {
      setLoading(false)
    }
  }

  // The transcript only covers TEXT questions (MCQs are auto-graded).
  const hasTextQuestions = attempt.quiz.questions.some((q: any) => q.type === "TEXT")

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Student Answers</h2>
        <div className="flex items-center gap-3">
          {hasTextQuestions && (
            <a
              href={`/api/instructor/attempts/${attempt.id}/transcript`}
              download
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Download className="w-4 h-4" />
              Get Transcript
            </a>
          )}
          {hasTextQuestions && attempt.status === "SUBMITTED" && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.target.value = ""
                }}
              />
              <Button variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Import Evaluation
              </Button>
            </>
          )}
          {attempt.status === "SUBMITTED" && (
            <Button onClick={handleFinalize} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <CheckCircle className="w-4 h-4" />
              {loading ? "Finalizing..." : "Finalize Grade"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {attempt.quiz.questions.map((question: any, idx: number) => {
          const studentAnswer = attempt.answers.find((a: any) => a.questionId === question.id);
          
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
                <div className="flex justify-between items-start mb-6">
                  <div className="text-lg">
                    {question.mathEnabled ? (
                      <MathText content={question.content} />
                    ) : (
                      <p>{question.content}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-4 whitespace-nowrap">
                    {question.points} Points
                  </Badge>
                </div>

                {question.type === "MCQ" ? (
                  <div className="space-y-3">
                    {question.options.map((opt: any) => {
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
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-semibold mb-2">Student&apos;s Response:</div>
                      <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap border">
                        {studentAnswer?.textAnswer || <span className="text-muted-foreground italic">No answer provided</span>}
                      </div>
                    </div>
                    
                    {/* Manual Grading Section */}
                    {studentAnswer && attempt.status === "SUBMITTED" && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-md border border-indigo-100 dark:border-indigo-900 flex items-end gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`score-${studentAnswer.id}`} className="text-indigo-900 dark:text-indigo-300 font-semibold mb-1 block">
                            Assign Score (0 - {question.points})
                          </Label>
                          <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3">
                            Review the student's text answer and assign a score.
                          </p>
                          <div className="flex items-center gap-2 max-w-xs">
                            <Input 
                              id={`score-${studentAnswer.id}`}
                              type="number" 
                              min="0" 
                              max={question.points}
                              step="0.5"
                              value={scores[studentAnswer.id] ?? 0}
                              onChange={(e) => handleScoreChange(studentAnswer.id, e.target.value, question.points)}
                              className="w-24 bg-white dark:bg-background"
                            />
                            <span className="text-sm font-medium">/ {question.points} points</span>
                          </div>
                          <div className="mt-4">
                            <Label htmlFor={`feedback-${studentAnswer.id}`} className="text-indigo-900 dark:text-indigo-300 font-semibold mb-1 block">
                              Feedback
                            </Label>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-2">
                              Explain the intended answer. Auto-filled when you import an evaluation.
                            </p>
                            <Textarea
                              id={`feedback-${studentAnswer.id}`}
                              rows={4}
                              placeholder="Explain the intended answer and what the student got right or wrong..."
                              value={feedback[studentAnswer.id] ?? ""}
                              onChange={(e) => handleFeedbackChange(studentAnswer.id, e.target.value)}
                              className="bg-white dark:bg-background"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display score and feedback if already graded */}
                    {studentAnswer && attempt.status === "GRADED" && (
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-md border flex items-center justify-between">
                          <span className="font-semibold">Awarded Score:</span>
                          <Badge variant={studentAnswer.manualScore === question.points ? "default" : "secondary"} className="text-base px-3 py-1">
                            {studentAnswer.manualScore ?? 0} / {question.points}
                          </Badge>
                        </div>
                        {studentAnswer.aiFeedback && (
                          <div className="bg-muted/50 p-4 rounded-md border">
                            <div className="text-sm font-semibold mb-1">Feedback:</div>
                            <div className="text-sm whitespace-pre-wrap text-muted-foreground">{studentAnswer.aiFeedback}</div>
                          </div>
                        )}
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