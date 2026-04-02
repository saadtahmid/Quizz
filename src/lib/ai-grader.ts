import { generateObject } from 'ai';
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
  const modelName = process.env.AI_MODEL || 'llama3';

  // If there's no answer, return 0 automatically without bothering the AI
  if (!studentAnswer || studentAnswer.trim() === '') {
    return {
      score: 0,
      feedback: "No answer provided.",
      isCorrect: false
    };
  }

  try {
    const { object } = await generateObject({
      model: localAIProvider(modelName),
      schema: z.object({
        score: z.number().describe(`The strict numeric score awarded (from 0 to ${maxPoints}).`),
        feedback: z.string().describe("1-2 sentences of professional feedback explaining why this exact score was given."),
        isCorrect: z.boolean().describe("true if the student's answer is correct or mostly correct, otherwise false."),
      }),
      temperature: 0,
      prompt: `
        You are a highly precise strict academic auto-grader.
        You MUST respond ONLY with a valid JSON object matching the requested schema. Do not include any other text or markdown formatting outside of the JSON object.
        
        Question: "${question}"
        Maximum Points Possible: ${maxPoints}
        Student's Answer: "${studentAnswer}"

        Task: Analyze the student's answer against the question.
        - Grade it strictly and fairly based ONLY on accuracy.
        - Determine if it is fully correct, partially correct, or incorrect.
        - Provide a brief, professional feedback explanation for the student.
        - Calculate the exact score out of ${maxPoints}.
      `,
    });

    return object;
  } catch (error) {
    console.error("[AI_GRADER_ERROR]", error);
    // Safe fallback if the local AI isn't running or times out
    return {
      score: 0,
      feedback: "AI Grading Failed (Server Offline or Timeout). Awaiting Instructor Manual Review.",
      isCorrect: false
    };
  }
}