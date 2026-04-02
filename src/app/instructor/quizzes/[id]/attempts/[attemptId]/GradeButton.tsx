"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

export default function GradeButton({ attemptId }: { attemptId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGrade = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/attempts/${attemptId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!res.ok) throw new Error("Failed to evaluate")
      
      const data = await res.json()
      toast.success(`Evaluation complete! Score updated to ${data.newScore}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to run evaluation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGrade} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
      <Sparkles className="w-4 h-4" />
      {loading ? "Evaluating..." : "Evaluate & Finalize"}
    </Button>
  )
}
