async function run() {
  console.log("Testing Ollama API with think=false...");
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:9b',
        think: false,
        stream: false,
        format: "json",
        options: { temperature: 0 },
        messages: [{
          role: "user",
          content: "Output exactly this JSON: {\"hello\": \"world\"}"
        }]
      })
    });

    const data = await response.json();
    console.log("\nRAW JSON:", data.message?.content);
    console.log("\nTHINK TRACE (if any):", data.message?.thinking);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
