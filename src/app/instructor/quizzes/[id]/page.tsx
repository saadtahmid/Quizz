"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { MathText } from "@/components/ui/math-text"
import Papa from "papaparse"

type OptionType = {
  id: string;
  text: string;
  isCorrect: boolean;
  mathEnabled: boolean;
}

type QuestionType = {
  id: string;
  type: "MCQ" | "TEXT";
  content: string;
  points: number;
  mathEnabled: boolean;
  options: OptionType[];
}

export default function QuizEditorPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  const [questions, setQuestions] = useState<QuestionType[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [timeLimit, setTimeLimit] = useState<number | "">("")
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        
        setTitle(data.title)
        setDescription(data.description || "")
        setTimeLimit(data.timeLimit || "")
        setIsPublished(data.isPublished)
        setQuestions(data.questions || [])
      } catch (error) {
        console.error(error)
        toast.error("Failed to load quiz")
      } finally {
        setLoading(false)
      }
    }
    if (quizId) fetchQuiz()
  }, [quizId])

  const saveQuiz = async (publishState: boolean) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          timeLimit: timeLimit === "" ? null : timeLimit,
          isPublished: publishState,
          questions
        })
      })

      if (!res.ok) throw new Error("Failed to save")
      
      setIsPublished(publishState)
      router.refresh()
      toast.success(publishState ? "Quiz Published successfully!" : "Draft Saved successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save quiz")
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(),
        type: "MCQ",
        content: "",
        points: 1,
        mathEnabled: false,
        options: [
          { id: Math.random().toString(), text: "", isCorrect: false, mathEnabled: false },
          { id: Math.random().toString(), text: "", isCorrect: false, mathEnabled: false },
        ]
      }
    ])
  }

  const updateQuestion = (qId: string, updates: Partial<QuestionType>) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, ...updates } : q))
  }

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId))
  }

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: [...q.options, { id: Math.random().toString(), text: "", isCorrect: false, mathEnabled: false }]
        }
      }
      return q
    }))
  }

  const updateOption = (qId: string, oId: string, updates: Partial<OptionType>) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map(o => o.id === oId ? { ...o, ...updates } : o)
        }
      }
      return q
    }))
  }

  const removeOption = (qId: string, oId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options.filter(o => o.id !== oId) }
      }
      return q
    }))
  }

  const cloneQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/clone`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to clone")
      const data = await res.json()
      toast.success("Quiz cloned successfully!")
      router.push(`/instructor/quizzes/${data.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to clone quiz")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];
          const parsedQuestions: QuestionType[] = data.map((row) => {
            const type = row.type?.toUpperCase() === "TEXT" ? "TEXT" : "MCQ"
            const content = row.content || ""
            const points = parseInt(row.points) || 1
            const mathEnabled = row.mathEnabled?.toLowerCase() === "true" || row.mathEnabled === "1"

            const options: OptionType[] = []
            
            if (type === "MCQ") {
              // Extract up to 10 options if present
              for (let i = 1; i <= 10; i++) {
                const optText = row[`option${i}_text`]
                const optCorrectStr = row[`option${i}_correct`]
                if (optText !== undefined && optText !== "") {
                  options.push({
                    id: Math.random().toString(),
                    text: optText,
                    isCorrect: optCorrectStr?.toLowerCase() === "true" || optCorrectStr === "1",
                    mathEnabled: false
                  })
                }
              }
              // If no options provided, give some defaults
              if (options.length === 0) {
                options.push(
                  { id: Math.random().toString(), text: "Option A", isCorrect: true, mathEnabled: false },
                  { id: Math.random().toString(), text: "Option B", isCorrect: false, mathEnabled: false }
                )
              }
            }

            return {
              id: Math.random().toString(),
              type,
              content,
              points,
              mathEnabled,
              options
            }
          })

          setQuestions(prev => [...prev, ...parsedQuestions])
          toast.success(`Successfully imported ${parsedQuestions.length} questions!`)
        } catch (error) {
          console.error("Error parsing CSV:", error)
          toast.error("Failed to parse CSV file. Ensure it has the correct headers.")
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      },
      error: (error) => {
        console.error("PapaParse error:", error)
        toast.error("Error reading the CSV file.")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    })
  }

  if (loading) {
    return <div className="p-8 text-center">Loading quiz data...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button variant="link" onClick={() => router.push("/instructor")} className="p-0 h-auto mb-2 text-muted-foreground">
            &larr; Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Edit Quiz</h1>
            {isPublished && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center gap-1 border border-yellow-200">
                🔒 Locked (Published)
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Status: {isPublished ? '🟢 Published' : '🟡 Draft'}</p>
        </div>
        <div className="flex gap-4">
          {isPublished ? (
            <Button onClick={cloneQuiz} className="bg-indigo-600 hover:bg-indigo-700">
              Clone to New Version
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => saveQuiz(false)} disabled={saving}>
                {saving && !isPublished ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => saveQuiz(true)} disabled={saving}>
                {saving && isPublished ? "Publishing..." : "Publish"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isPublished && (
        <div className="mb-8 p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-1">This quiz is published and final.</h3>
          <p className="text-sm">To protect the integrity of student results, published quizzes cannot be modified. If you need to make changes or fix an error, please click <strong>&quot;Clone to New Version&quot;</strong> to create an editable copy.</p>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPublished} />
            </div>
            <div>
              <Label>Time Limit (minutes)</Label>
              <Input 
                type="number" 
                min={1} 
                placeholder="Leave empty for no limit"
                value={timeLimit} 
                onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : "")} 
                disabled={isPublished} 
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPublished} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader className="flex flex-row justify-between items-start space-y-0">
              <div>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>Setup your question content and type.</CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={() => removeQuestion(q.id)} disabled={isPublished}>Delete</Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Type</Label>
                  <Select value={q.type} onValueChange={(val) => { if (val) updateQuestion(q.id, { type: val as "MCQ" | "TEXT" }) }} disabled={isPublished}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice</SelectItem>
                      <SelectItem value="TEXT">Direct Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Points</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={q.points} 
                    onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })} 
                    disabled={isPublished}
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch 
                    checked={q.mathEnabled} 
                    onCheckedChange={(val) => updateQuestion(q.id, { mathEnabled: val })} 
                    disabled={isPublished}
                  />
                  <Label>Enable Math (LaTeX)</Label>
                </div>
              </div>

              <div>
                <Label>Question Content</Label>
                <Textarea 
                  value={q.content} 
                  onChange={(e) => updateQuestion(q.id, { content: e.target.value })}
                  placeholder="Enter the question text..."
                  className="mb-2"
                  disabled={isPublished}
                />
                {q.mathEnabled && q.content && (
                  <div className="p-4 bg-muted rounded-md text-sm">
                    <p className="font-semibold mb-2">Live Preview:</p>
                    <MathText content={q.content} />
                  </div>
                )}
              </div>

              {q.type === "MCQ" && (
                <div>
                  <Label className="mb-2 block">Options</Label>
                  <div className="flex flex-col gap-3">
                    {q.options.map((o, oIndex) => (
                      <div key={o.id} className="flex items-start gap-3">
                        <div className="mt-3">
                          <Checkbox 
                            checked={o.isCorrect} 
                            onCheckedChange={(val) => updateOption(q.id, o.id, { isCorrect: val === true })} 
                            disabled={isPublished}
                          />
                        </div>
                        <div className="flex-1">
                          <Input 
                            value={o.text} 
                            onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                            placeholder={`Option ${oIndex + 1}`}
                            disabled={isPublished}
                          />
                          {q.mathEnabled && o.text && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              <MathText content={o.text} />
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeOption(q.id, o.id)} className="mt-0.5 text-destructive" disabled={isPublished}>
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addOption(q.id)} className="w-fit mt-2" disabled={isPublished}>
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {!isPublished && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button size="lg" variant="secondary" className="w-full border-dashed border-2" onClick={addQuestion}>
              + Add New Question Manually
            </Button>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <Button size="lg" type="button" variant="outline" className="w-full border-dashed border-2 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 border-indigo-200 pointer-events-none">
                <Upload className="w-4 h-4 mr-2" />
                Upload Questions via CSV
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
