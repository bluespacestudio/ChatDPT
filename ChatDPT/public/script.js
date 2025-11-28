const userInput = document.querySelector("#user-input");
const chatContainer = document.querySelector("#chat-container");
const sendButton = document.querySelector("#send-button");
const fileInput = document.querySelector("#file-input");
const uploadButton = document.querySelector("#upload-button");
const selectedFile = document.querySelector("#selected-file");
const uploadStatus = document.querySelector("#upload-status");

const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

userInput.addEventListener("keyup", handleEnter);
sendButton.addEventListener("click", handleClick);
fileInput.addEventListener("change", handleFileChange);
uploadButton.addEventListener("click", handleUpload);

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
  const response = await fetch("/chat", {
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

function handleFileChange() {
  const file = fileInput.files?.[0];
  selectedFile.textContent = file
    ? `${file.name} (${Math.round(file.size / 1024)} KB)`
    : "No file selected";
  uploadStatus.textContent = "";
}

async function handleUpload() {
  const file = fileInput.files?.[0];

  if (!file) {
    uploadStatus.textContent = "Choose a PDF to upload.";
    uploadStatus.className = "text-sm text-amber-300";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("threadId", threadId);

  uploadStatus.textContent = "Uploading & indexing...";
  uploadStatus.className = "text-sm text-emerald-300";

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || "Upload failed");
    }

    const data = await response.json();
    uploadStatus.textContent = data.message || "Uploaded successfully.";
    uploadStatus.className = "text-sm text-emerald-300";
    fileInput.value = "";
    selectedFile.textContent = "No file selected";
  } catch (error) {
    console.error("Upload error:", error);
    uploadStatus.textContent = error.message || "Upload failed. Try again.";
    uploadStatus.className = "text-sm text-red-400";
  }
}
