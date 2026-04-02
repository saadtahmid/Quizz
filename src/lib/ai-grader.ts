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
    const { text } = await generateText({
      model: localAIProvider(modelName),
      temperature: 0,
      system: `
        You are a highly precise strict academic auto-grader.
        You MUST respond ONLY with a valid JSON object representing your grading. 
        Do not include any markdown formatting like \`\`\`json or \`\`\`. Do not include any conversational text.
        The JSON object must have exactly these three properties:
        - "score": a number from 0 to ${maxPoints}
        - "feedback": a string with 1-2 sentences of professional feedback explaining the score
        - "isCorrect": a boolean (true if the student's answer is mostly/fully correct, otherwise false)
      `,
      prompt: `
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
    
    // Attempt to extract JSON if the model added markdown despite our instructions
    let jsonString = text.trim();
    // Sometimes the model outputs thought process before the JSON (e.g. reasoning models)
    // We can try to extract just the first { ... } block
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
      }
    }

    const object = JSON.parse(jsonString);

    //print the question, student answer, and raw AI response for debugging
    console.log(`[AI_GRADER] Question: ${question}`);
    console.log(`[AI_GRADER] Student Answer: ${studentAnswer}`);
    console.log(`[AI_GRADER] Model Used: ${modelName}`);
    console.log(`[AI_GRADER] Raw response from AI:`, object);
    
    return {
      score: Number(object.score) || 0,
      feedback: String(object.feedback) || "No feedback generated.",
      isCorrect: Boolean(object.isCorrect)
    };
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