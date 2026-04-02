import http from 'http';

const req = http.request('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let count = 0;
  res.on('data', (chunk) => {
    const json = JSON.parse(chunk.toString());
    process.stdout.write(json.response);
    count++;
    if (count > 50) {
      console.log("\n[STOPPING STREAM EARLY]");
      process.exit(0);
    }
  });
});

req.write(JSON.stringify({
  model: 'qwen3.5:9b',
  prompt: `
    You are a highly precise strict academic auto-grader.
    You MUST respond ONLY with a valid JSON object representing your grading. 
    Do not include any markdown formatting like \`\`\`json or \`\`\`. Do not include any conversational text.
    The JSON object must have exactly these three properties:
    - "score": a number from 0 to 5
    - "feedback": a string with 1-2 sentences of professional feedback explaining the score
    - "isCorrect": a boolean (true if the student's answer is mostly/fully correct, otherwise false)
  
    Question: "Explain the theory of relativity."
    Maximum Points Possible: 5
    Student's Answer: "It means time and space are connected, and moving fast changes time."

    Task: Analyze the student's answer against the question.
    - Grade it strictly and fairly based ONLY on accuracy.
    - Determine if it is fully correct, partially correct, or incorrect.
    - Provide a brief, professional feedback explanation for the student.
    - Calculate the exact score out of 5.
  `,
  stream: true,
  options: {
    temperature: 0
  }
}));

req.end();
