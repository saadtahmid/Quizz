"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"

export default function GradeButton({ attemptId }: { attemptId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleFinalize = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/attempts/${attemptId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
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

  return (
    <Button onClick={handleFinalize} disabled={loading} className="gap-2">
      <CheckCircle className="w-4 h-4" />
      {loading ? "Finalizing..." : "Finalize Grade"}
    </Button>
  )
}