import { Ollama } from 'ollama';

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
  const baseUrl = process.env.AI_BASE_URL || 'http://localhost:11434';

  const ollama = new Ollama({ host: baseUrl });

  const jsonSchema = {
    type: "object",
    properties: {
      score: {
        type: "number",
        description: `The score from 0 to ${maxPoints}`
      },
      feedback: {
        type: "string",
        description: "1-2 sentences of professional feedback explaining the score"
      },
      isCorrect: {
        type: "boolean",
        description: "true if the student's answer is mostly/fully correct, otherwise false"
      }
    },
    required: ["score", "feedback", "isCorrect"]
  };

  try {
    const response = await Promise.race([
      ollama.chat({
        model: modelName,
        messages: [
          {
            role: "system",
            content: `You are a highly precise strict academic auto-grader. Grade strictly based on accuracy.`
          },
          {
            role: "user",
            content: `Question: "${question}"\nMaximum Points Possible: ${maxPoints}\nStudent's Answer: "${studentAnswer}"\n\nTask: Analyze the student's answer against the question. Determine if it is fully correct, partially correct, or incorrect. Calculate the exact score out of ${maxPoints}.`
          }
        ],
        format: jsonSchema as any,
        options: {
          temperature: 0
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI API timeout')), 30000)
      )
    ]);

    let aiText = response.message?.content || "{}";

    // Just in case it sneaks in a <think> tag inside the raw content somehow
    aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    console.log(`[AI_GRADER] Raw AI Text (cleaned):`, aiText);

    const object = JSON.parse(aiText);

    console.log(`[AI_GRADER] Success! Parsed object:`, object);
    
    return {
      score: Number(object.score) || 0,
      feedback: String(object.feedback) || "No feedback generated.",
      isCorrect: Boolean(object.isCorrect)
    };
  } catch (error) {
    console.error("[AI_GRADER_ERROR]", error);
    return {
      score: 0,
      feedback: "AI Grading Failed (Server Offline, Timeout, or Bad Output). Awaiting Instructor Manual Review.",
      isCorrect: false
    };
  }
}