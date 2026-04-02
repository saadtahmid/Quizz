import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const localAIProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'local',
});

async function run() {
  const modelName = 'qwen3.5:9b';
  const question = "Explain the theory of relativity.";
  const studentAnswer = "It means time and space are connected, and moving fast changes time.";
  const maxPoints = 5;

  console.log(`[TEST] Using model: ${modelName}`);
  console.log(`[TEST] Question: ${question}`);
  
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

    console.log("\n--- RAW AI OUTPUT ---");
    console.log(text);
    console.log("---------------------\n");

    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const object = JSON.parse(jsonString);
    console.log("[TEST] Successfully parsed JSON:", object);

  } catch (error) {
    console.error("[TEST] Error:", error.message);
  }
}

run();
