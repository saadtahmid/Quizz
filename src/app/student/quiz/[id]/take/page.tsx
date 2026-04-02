"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MathText } from "@/components/ui/math-text"

type ProctorEvent = {
  type: string;
  timestamp: number;
  details?: string;
}

export default function TakeExamPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [proctorEvents, setProctorEvents] = useState<ProctorEvent[]>([])

  // Proctoring setup
  useEffect(() => {
    // 1. Focus Mode: Prevent context menu, copy, cut, paste
    const preventAction = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("paste", preventAction);

    // 2. Page Visibility Tracking: Tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorEvents(prev => [
          ...prev, 
          { type: "TAB_SWITCH", timestamp: Date.now(), details: "Tab minimized or switched" }
        ]);
        alert("Warning: Leaving the exam tab is a proctoring violation. This action has been logged.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Window blur tracking: Alt-tabbing to other apps while tab is technically visible
    const handleBlur = () => {
      setProctorEvents(prev => [
        ...prev, 
        { type: "BLUR", timestamp: Date.now(), details: "Window lost focus" }
      ]);
    };
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);


  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/student/quizzes/${quizId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setQuiz(data)
      } catch (error) {
        console.error(error)
        alert("Failed to load quiz or it is not available.")
        router.push("/student")
      } finally {
        setLoading(false)
      }
    }
    if (quizId) fetchQuiz()
  }, [quizId, router])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit your exam? You cannot undo this action.")) return;
    setSubmitting(true)
    
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, proctorEvents }),
      })

      if (!res.ok) throw new Error("Failed to submit")
      const data = await res.json()

      alert(`Exam submitted successfully! Score: ${data.score}`);
      router.push("/student")
    } catch (err) {
      console.error(err)
      alert("Error submitting exam")
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Preparing secure exam environment...</div>
  }

  if (!quiz) return null;

  return (
    // select-none prevents highlighting text in the exam to mitigate copying
    <div className="max-w-4xl mx-auto p-8 select-none">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && <p className="text-muted-foreground mt-2">{quiz.description}</p>}
        </div>
        <div className="text-right">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Exam"}
          </Button>
          <div className="text-xs text-destructive mt-2 font-semibold">
            SECURE MODE ACTIVE
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {quiz.questions.map((q: any, idx: number) => (
          <Card key={q.id} id={`question-${q.id}`}>
            <CardHeader>
              <CardTitle className="text-lg flex justify-between">
                <span>Question {idx + 1}</span>
                <span className="text-sm font-normal text-muted-foreground">{q.points} point(s)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-lg">
                {q.mathEnabled ? (
                  <MathText content={q.content} />
                ) : (
                  <p>{q.content}</p>
                )}
              </div>

              {q.type === "MCQ" ? (
                <RadioGroup 
                  onValueChange={(val) => handleAnswerChange(q.id, val)}
                  value={answers[q.id] || ""}
                  className="flex flex-col gap-4"
                >
                  {q.options.map((o: any) => (
                    <div key={o.id} className="flex items-start space-x-3 border p-4 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleAnswerChange(q.id, o.id)}>
                      <RadioGroupItem value={o.id} id={o.id} className="mt-1" />
                      <Label htmlFor={o.id} className="font-normal text-base w-full cursor-pointer leading-snug">
                        {o.mathEnabled ? (
                          <MathText content={o.text} />
                        ) : (
                          o.text
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea 
                  placeholder="Type your answer here..."
                  rows={6}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Exam"}
        </Button>
      </div>
    </div>
  )
}
