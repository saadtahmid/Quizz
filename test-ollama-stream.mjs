async function run() {
  console.log("Testing raw Ollama API (Streaming)...");
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5:9b',
        prompt: `Hello, respond with {"status": "ok"}`,
        format: "json",
        stream: true,
        options: { temperature: 0 }
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    // Node.js fetch stream handling
    for await (const chunk of response.body) {
      const decoded = new TextDecoder().decode(chunk);
      process.stdout.write(decoded);
    }
  } catch (err) {
    console.error("\nERROR:", err.message);
  }
}
run();
