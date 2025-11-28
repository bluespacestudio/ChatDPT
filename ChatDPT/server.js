import express from "express";
import multer from "multer";
import cors from "cors";
import "dotenv/config";

import { generateResponse } from "./ChatBot.js";
import { indexPdfBuffer } from "./vectorStore.js";

const app = express();
const port = 3001;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

app.use(cors());

app.use(express.static("public"));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to ChatDPT server!');
});

app.post('/chat', async (req, res) => {
  const { message, threadId } = req.body;

  if(!message && !threadId) {
    return res.status(400).json({ error: 'All fileds are required.' });
  }
  console.log("Message received:", message);

  const responseMessage = await generateResponse(message, threadId);

  res.json({ message: responseMessage });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const { threadId } = req.body;

  if (!req.file || !threadId) {
    return res
      .status(400)
      .json({ error: "PDF file and threadId are required." });
  }

  if (req.file.mimetype !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are supported." });
  }

  try {
    const chunksIndexed = await indexPdfBuffer(req.file.buffer, {
      filename: req.file.originalname,
      threadId,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.json({
      message: `Uploaded and indexed ${chunksIndexed} chunks from ${req.file.originalname}. You can now chat about it.`,
    });
  } catch (error) {
    console.error("File upload failed:", error);
    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong while indexing the uploaded file.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
