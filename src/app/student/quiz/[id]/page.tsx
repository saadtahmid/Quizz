"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function StudentQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Exam Ready</h1>
      <p className="text-muted-foreground mb-8">
        You are about to start the exam. Ensure you are in a quiet environment.
      </p>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/student")}>
          Cancel
        </Button>
        <Button>
          Start Exam
        </Button>
      </div>
    </div>
  )
}
