const userInput = document.querySelector("#user-input");
const chatContainer = document.querySelector("#chat-container");
const sendButton = document.querySelector("#send-button");

const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

userInput.addEventListener("keyup", handleEnter);
sendButton.addEventListener("click", handleClick);

const assistantThinking = document.createElement("div");
assistantThinking.className = "my-6 animate-pulse";
assistantThinking.textContent = "Thinking...";


function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function handleClick() {
  const text = userInput.value.trim();
  if (!text) return;
  await generateResponse(text);
}

async function generateResponse(text) {
  // Display user message
  const msg = document.createElement("div");
  msg.className = "my-6 bg-neutral-800 px-3 py-2 rounded-xl ml-auto max-w-fit";
  msg.textContent = text;
  chatContainer?.appendChild(msg);
  scrollToBottom()

  userInput.value = "";
  chatContainer?.appendChild(assistantThinking);
  scrollToBottom();

  // Call backend API
  const assistantMessage = await callServerAPI(text);
  console.log("Assistant message - ", assistantMessage);
  chatContainer.removeChild(assistantThinking);

  // Display assistant message
  const botMsg = document.createElement("div");
  botMsg.className = "max-w-fit";
  botMsg.textContent = assistantMessage;
  chatContainer.appendChild(botMsg);
  scrollToBottom();
}

async function callServerAPI(inputText) {
  const response = await fetch(process.env.Backend_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadId: threadId, message: inputText }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const responseData = await response.json();
  return responseData.message;
}

async function handleEnter(e) {
  if (e.key === "Enter") {
    const text = userInput.value.trim();
    if (!text) return;
    await generateResponse(text);
  }
}
