const aiText = `
<think>
This student gave a good answer.
I should give them a 5 out of 5.
</think>
{
  "score": 5,
  "feedback": "Great job.",
  "isCorrect": true
}
`;

const cleaned = aiText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
console.log("CLEANED:", cleaned);
