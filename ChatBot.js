import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cacheMemory = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache for 24 hour

export async function generateResponse(userMessage, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `You are Jarvis, a smart personal assistant who answers the asked questions
           You have access to a web search tool to search the latest information and realtime data on the internet.
           Use the web search tool when you don't know the answer to a question or when the question is about recent events.
           Always use the web search tool to get the latest information about current events, news, or recent developments.
           Currently, the dateTime is ${new Date().toUTCString()}
           You are a helpful assistant. Follow the format exactly as shown.
           Example 1
           User: Summarize this: "React is a JavaScript library for building UIs."
           Assistant: React is a JS library used to build user interfaces.
           Example 2
           User: Summarize this: "Supabase is an open-source Firebase alternative."
           Assistant: Supabase is an open-source backend similar to Firebase.
           Nitin Bharti is your owner. Be polite and respectful while interacting with him.`,
    },
    // {
    //   role: "user",
    //   content: `What are the key features of Next.JS?`,
    //   //   When the IPhone 16 was launched?
    //   //   What are the key features of Next.JS?
    // },
  ];

  const messages = cacheMemory?.get(threadId) ?? baseMessages; 

  messages.push({ role: "user", content: userMessage });

  const max_Retries = 10;
  let count = 0;
  while (true) {
    if(count > max_Retries) {
      return Error("I am sorry, but I am unable to process your request at the moment. Please try again later.");
    }
    count++;
    const completion = await groq.chat.completions.create({
      temperature: 0,
      // top_p: 0.2,
      // stop: 'ti', 'Positive'
      // max_completion_tokens: 1000,
      // frequency_penalty: 1,
      // presence_penalty: 1,
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearchTool",
            description:
              "Search the latest information and realtime data on the internet",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query performed on the web search",
                },
                //   unit: {
                //     type: "string",
                //     enum: ["celsius", "fahrenheit"],
                //   },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    messages.push(completion.choices[0].message);
    const toolCalls = completion.choices[0].message.tool_calls;

    if (!toolCalls) {
      // Final answer from the assistant
      cacheMemory?.set(threadId, messages);
      console.log(cacheMemory);
      return completion.choices[0].message.content;
    }

    for (const toolCall of toolCalls) {
      if (toolCall.function.name === "webSearchTool") {
        const functionName = toolCall.function.name;
        const funtionArgs = toolCall.function.arguments;

        if (functionName === "webSearchTool") {
          const toolResult = await webSearchTool(JSON.parse(funtionArgs));
          //   console.log(`Tool Result - ${toolResult}`);
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      }
    }
  }
}

async function webSearchTool({ query }) {
  const response = await tvly.search(query);

  const finalResult = response.results.map((res) => res.content).join("\n\n");
  console.log("Calling web Search Result...");
  return finalResult;
}
