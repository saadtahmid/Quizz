// Removed unused Vercel AI SDK and OpenAI imports
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
  const baseUrl = process.env.AI_BASE_URL || 'http://localhost:11434/api';
  const apiKey = process.env.AI_API_KEY || 'local';

  // We set a strict 30-second timeout so the UI never hangs indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        options: {
          temperature: 0,
        },
        stream: false,
        format: "json", // Native Ollama JSON formatting
        think: false, // Turn off thinking trace natively (if supported)
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
    
    // Fallback to openai compat parsing just in case baseUrl wasn't /api
    let aiText = data.message?.content || data.choices?.[0]?.message?.content || "{}";

    // Aggressively remove <think>...</think> tags which are output by DeepSeek and Qwen reasoning models
    aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    console.log(`[AI_GRADER] Raw AI Text (cleaned):`, aiText);

    let object: any = null;
    let jsonString = aiText.trim();

    // Aggressive JSON extraction fallback
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const tryParseAndValidate = (str: string) => {
      try {
        const p = JSON.parse(str);
        if (p && typeof p === 'object') {
          // Direct match
          if (p.score !== undefined || p.feedback !== undefined || p.isCorrect !== undefined) {
            return p;
          }
          // Sometimes models nest the answer inside another key (e.g., {"grading": { "score": ... }})
          for (const key of Object.keys(p)) {
            if (p[key] && typeof p[key] === 'object') {
              if (p[key].score !== undefined || p[key].feedback !== undefined) {
                return p[key];
              }
            }
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    object = tryParseAndValidate(jsonString);

    if (!object) {
      // Fallback 1: Greedy match for the largest JSON block
      const greedyMatch = aiText.match(/\{[\s\S]*\}/);
      if (greedyMatch) {
        object = tryParseAndValidate(greedyMatch[0]);
      }
      
      // Fallback 2: Non-greedy match (in case of multiple separate blocks)
      if (!object) {
        const jsonMatches = aiText.match(/\{[\s\S]*?\}/g) || [];
        for (const match of jsonMatches) {
          object = tryParseAndValidate(match);
          if (object) break;
        }
      }
    }

    if (!object) {
      throw new Error(`Failed to parse any valid JSON with expected keys from model output. Raw output was: ${aiText}`);
    }

    console.log(`[AI_GRADER] Success! Parsed object:`, object);
    
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