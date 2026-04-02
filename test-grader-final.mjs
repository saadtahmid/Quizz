async function run() {
  const aiText = `Here is your grade:
  \`\`\`json
  {
    "evaluation": {
      "score": 5,
      "feedback": "Perfect answer.",
      "isCorrect": true
    }
  }
  \`\`\`
  `;
  
  console.log(`[AI_GRADER] Raw AI Text:`, aiText);

  let object = null;
  let jsonString = aiText.trim();

  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const tryParseAndValidate = (str) => {
    try {
      const p = JSON.parse(str);
      if (p && typeof p === 'object') {
        if (p.score !== undefined || p.feedback !== undefined || p.isCorrect !== undefined) {
          return p;
        }
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
    const jsonMatches = aiText.match(/\{[\s\S]*?\}/g) || [];
    for (const match of jsonMatches) {
      object = tryParseAndValidate(match);
      if (object) break;
    }
  }

  console.log(`[AI_GRADER] Success! Parsed object:`, object);
}
run();
