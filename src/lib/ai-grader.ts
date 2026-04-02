import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// We create a custom provider that points to our local AI!
// Ollama has a built-in OpenAI compatible endpoint at /v1.
const localAIProvider = createOpenAI({
  baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.AI_API_KEY || 'local', // Any string works for Ollama
});

export async function autoGradeTextAnswer(
  question: string,
  studentAnswer: string,
  maxPoints: number
) {
  // If there's no answer, return 0 automatically without bothering the AI
  if (!studentAnswer || studentAnswer.trim() === '') {
    return {
      score: 0,
      feedback: "No answer provided.",
      isCorrect: false
    };
  }

  const modelName = process.env.AI_MODEL || 'llama3';
  const baseUrl = process.env.AI_BASE_URL || 'http://localhost:11434/v1';
  const apiKey = process.env.AI_API_KEY || 'local';

  // We set a strict 30-second timeout so the UI never hangs indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        temperature: 0,
        max_tokens: 500, // Hard stop after 500 tokens to prevent infinite loops
        response_format: { type: "json_object" }, // Force OpenAI compat endpoints to return JSON
        messages: [
          {
            role: "system",
            content: `
              You are a highly precise strict academic auto-grader.
              You MUST respond ONLY with a valid JSON object. 
              The JSON object must have exactly these three properties:
              - "score": a number from 0 to ${maxPoints}
              - "feedback": a string with 1-2 sentences of professional feedback explaining the score
              - "isCorrect": a boolean (true if the student's answer is mostly/fully correct, otherwise false)
            `
          },
          {
            role: "user",
            content: `
              Question: "${question}"
              Maximum Points Possible: ${maxPoints}
              Student's Answer: "${studentAnswer}"

              Task: Analyze the student's answer against the question.
              - Grade it strictly and fairly based ONLY on accuracy.
              - Determine if it is fully correct, partially correct, or incorrect.
              - Provide a brief, professional feedback explanation for the student.
              - Calculate the exact score out of ${maxPoints}.
            `
          }
        ]
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiText = data.choices[0]?.message?.content || "{}";

    let object: any = null;
    let jsonString = aiText.trim();

    // Aggressive JSON extraction fallback (in case response_format is ignored by local models)
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      object = JSON.parse(jsonString);
    } catch (e) {
      const jsonMatches = aiText.match(/\{[\s\S]*?\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const parsed = JSON.parse(match);
            if (parsed && (parsed.score !== undefined || parsed.feedback !== undefined || parsed.isCorrect !== undefined)) {
              object = parsed;
              break;
            }
          } catch (err) { /* ignore */ }
        }
      }
    }

    if (!object) {
      throw new Error(`Failed to parse any valid JSON from model output. Raw output was: ${aiText}`);
    }

    console.log(`[AI_GRADER] Success! Given score: ${object.score}`);
    
    return {
      score: Number(object.score) || 0,
      feedback: String(object.feedback) || "No feedback generated.",
      isCorrect: Boolean(object.isCorrect)
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[AI_GRADER_ERROR]", error);
    return {
      score: 0,
      feedback: "AI Grading Failed (Server Offline, Timeout, or Bad Output). Awaiting Instructor Manual Review.",
      isCorrect: false
    };
  }
}