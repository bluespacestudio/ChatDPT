import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import * as readline from 'node:readline/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const messages = [
    {
      role: "system",
      content: `You are Jarvis, a smart personal assistant who answers the asked questions
           You have access to a web search tool to search the latest information and realtime data on the internet.
           Use the web search tool when you don't know the answer to a question or when the question is about recent events.
           Always use the web search tool to get the latest information about current events, news, or recent developments.
           Currently, the dateTime is ${new Date().toUTCString()}
           Nitin Bharti is your owner. Be polite and respectful while interacting with him.`,
    }
    // {
    //   role: "user",
    //   content: `What are the key features of Next.JS?`,
    //   //   When the IPhone 16 was launched?
    //   //   What are the key features of Next.JS?
    // },
  ];
  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.toLowerCase() === "exit") {
      console.log("Exiting...");
      break;
    }
    messages.push({ role: "user", content: userInput });
    while (true) {
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
        console.log(`Assistant - ${completion.choices[0].message.content}`);
        break;
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

      //    const completion2 = await groq.chat.completions.create({
      //     temperature: 0,
      //     // top_p: 0.2,
      //     // stop: 'ti', 'Positive'
      //     // max_completion_tokens: 1000,
      //     // frequency_penalty: 1,
      //     // presence_penalty: 1,
      //     model: "llama-3.3-70b-versatile",
      //     messages: messages,
      //     tools: [
      //       {
      //         type: "function",
      //         function: {
      //           name: "webSearchTool",
      //           description:
      //             "Search the latest information and realtime data on the internet",
      //           parameters: {
      //             type: "object",
      //             properties: {
      //               query: {
      //                 type: "string",
      //                 description: "The search query performed on the web search",
      //               },
      //               //   unit: {
      //               //     type: "string",
      //               //     enum: ["celsius", "fahrenheit"],
      //               //   },
      //             },
      //             required: ["query"],
      //           },
      //         },
      //       },
      //     ],
      //     tool_choice: "auto",
      //   });

      // console.log(JSON.stringify(completion2.choices[0].message, null, 2));
    }
  }
  rl.close();
}

main();

async function webSearchTool({ query }) {
  const response = await tvly.search(query);

  const finalResult = response.results.map((res) => res.content).join("\n\n");

  //   console.log("Response from Tavily Web Search:", finalResult);
  //   console.log(`Web Search Tool Invoked with query: ${query}`);
  console.log("Calling web Search Result...");
  return finalResult;
}
