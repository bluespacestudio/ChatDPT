import readline from "readline/promises";
import Groq from "groq-sdk";
import "dotenv/config";
import { vectorStore } from "./prepare.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput === "/bye") {
      break;
    }
    // console.log(userInput);
    const releverntChunks = await vectorStore.similaritySearch(userInput, 3);
    const context = releverntChunks
      .map((chunks) => chunks.pageContent)
      .join("\n\n");
    const systemPrompt = `You are a helpful AI assistant. Use the following context to answer the question. If you don't know the answer, just say that you don't know, don't try to make up an answer.`;

    const userQuery = `Question: ${userInput}
    Context: ${context} 
    Answer:`;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userQuery,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    console.log("AI: ", completion.choices[0].message.content);
  }
  rl.close();
}

chat();
