import express from 'express';
import { generateResponse } from './ChatBot.js';
import cors from 'cors';

const app = express();
const port = 3001;

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

app.listen(port, () => {
  console.log(`Server is running on: ${port}`);
});
