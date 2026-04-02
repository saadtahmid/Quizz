"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

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

export default function QuizEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  // Mock data setup, typically fetched from the server.
  const [questions, setQuestions] = useState<QuestionType[]>([])

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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button variant="link" onClick={() => router.push("/instructor")} className="p-0 h-auto mb-2 text-muted-foreground">
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Edit Quiz</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">Save Draft</Button>
          <Button>Publish</Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader className="flex flex-row justify-between items-start space-y-0">
              <div>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>Setup your question content and type.</CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={() => removeQuestion(q.id)}>Delete</Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Type</Label>
                  <Select value={q.type} onValueChange={(val: any) => updateQuestion(q.id, { type: val })}>
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
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Switch 
                    checked={q.mathEnabled} 
                    onCheckedChange={(val) => updateQuestion(q.id, { mathEnabled: val })} 
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
                />
                {q.mathEnabled && q.content && (
                  <div className="p-4 bg-muted rounded-md text-sm">
                    <p className="font-semibold mb-2">Live Preview:</p>
                    <BlockMath math={q.content} errorColor={'#cc0000'} renderError={() => <span className="text-destructive">Invalid LaTeX</span>} />
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
                          />
                        </div>
                        <div className="flex-1">
                          <Input 
                            value={o.text} 
                            onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          {q.mathEnabled && o.text && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              <InlineMath math={o.text} errorColor={'#cc0000'} renderError={() => <span className="text-destructive">Invalid LaTeX</span>} />
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeOption(q.id, o.id)} className="mt-0.5 text-destructive">
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addOption(q.id)} className="w-fit mt-2">
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button size="lg" variant="secondary" className="w-full border-dashed border-2" onClick={addQuestion}>
          + Add New Question
        </Button>
      </div>
    </div>
  )
}
