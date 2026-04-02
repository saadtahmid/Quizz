import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const localAIProvider = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'local',
});

async function run() {
  try {
    const { text } = await generateText({
      model: localAIProvider("qwen3.5:9b"),
      temperature: 0,
      system: `
        You are a highly precise strict academic auto-grader.
        You MUST respond ONLY with a valid JSON object representing your grading. 
        Do not include any markdown formatting like \`\`\`json or \`\`\`. Do not include any conversational text.
        The JSON object must have exactly these three properties:
        - "score": a number from 0 to 5
        - "feedback": a string with 1-2 sentences of professional feedback explaining the score
        - "isCorrect": a boolean (true if the student's answer is mostly/fully correct, otherwise false)
      `,
      prompt: `
        Question: "Explain the theory of relativity in simple terms."
        Maximum Points Possible: 5
        Student's Answer: "It says that space and time are actually the same thing, and they stretch or shrink depending on how fast you're moving or how much gravity there is."

        Task: Analyze the student's answer against the question.
        - Grade it strictly and fairly based ONLY on accuracy.
        - Determine if it is fully correct, partially correct, or incorrect.
        - Provide a brief, professional feedback explanation for the student.
        - Calculate the exact score out of 5.
      `,
    });

    console.log("RAW TEXT RESPONSE:");
    console.log(text);
    
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const object = JSON.parse(jsonString);
    console.log("\nPARSED OBJECT:");
    console.log(object);

  } catch (error) {
    console.error("\nTEST ERROR:", error);
  }
}

run();
