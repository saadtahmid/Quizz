async function run() {
  console.log("Testing raw Ollama API...");
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:9b',
        prompt: `
        Analyze this student's answer against the question and provide a grade.
        
        Question: "Explain the theory of relativity."
        Maximum Points Possible: 5
        Student's Answer: "It means time and space are connected, and moving fast changes time."

        Respond ONLY with a JSON object. No markdown, no explanations, just the JSON.
        The JSON object must have exactly these three properties:
        - "score": a number from 0 to 5
        - "feedback": a string with 1-2 sentences of professional feedback explaining the score
        - "isCorrect": a boolean (true if the student's answer is mostly/fully correct, otherwise false)
        `,
        format: "json", // Native Ollama JSON enforcement!
        stream: false,
        options: {
          temperature: 0
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("\n--- RAW OLLAMA RESPONSE ---");
    console.log(data.response);
    
    console.log("\n--- PARSED JSON ---");
    console.log(JSON.parse(data.response));
  } catch (err) {
    console.error("\nERROR:", err.message);
  }
}

run();
