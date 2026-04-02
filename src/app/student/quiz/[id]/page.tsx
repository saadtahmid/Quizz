"use client"

import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function StudentQuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  return (
    <div className="max-w-4xl mx-auto p-8 text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">Exam Ready</h1>
      <p className="text-muted-foreground mb-8">
        You are about to start the exam. Ensure you are in a quiet environment. <br />
        <span className="font-semibold text-destructive">
          Once you start, leaving the tab, switching windows, or trying to copy text will be logged as an integrity violation!
        </span>
      </p>
      
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
