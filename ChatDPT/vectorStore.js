import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import "dotenv/config";

const requiredEnv = ["OPENAI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX_NAME"];
const missing = requiredEnv.filter((key) => !process.env[key]);

let vectorStore = null;

if (missing.length) {
  console.warn(
    `Vector store not initialized. Missing environment variables: ${missing.join(
      ", ",
    )}`,
  );
} else {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
}

export async function indexPdfBuffer(fileBuffer, metadata = {}) {
  if (!vectorStore) {
    throw new Error(
      "Vector store is not configured. Please set OPENAI_API_KEY, PINECONE_API_KEY, and PINECONE_INDEX_NAME.",
    );
  }

  if (!fileBuffer?.length) {
    throw new Error("No file buffer provided for indexing.");
  }

  // PDFLoader expects a Blob in the browser or Buffer/Blob-like in Node.
  const pdfSource =
    typeof Blob !== "undefined" ? new Blob([fileBuffer]) : Buffer.from(fileBuffer);

  const loader = new PDFLoader(pdfSource, { splitPages: false });
  const docs = await loader.load();

  if (!docs.length) {
    throw new Error("Unable to read any pages from the uploaded PDF.");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const doc = docs[0];
  const chunks = await splitter.splitText(doc.pageContent || "");

  const documents = chunks.map((chunk) => ({
    pageContent: chunk,
    metadata: {
      ...doc.metadata,
      ...metadata,
    },
  }));

  await vectorStore.addDocuments(documents);

  return documents.length;
}

export async function fetchSimilarContent(query, filter) {
  if (!vectorStore || !query?.trim()) {
    return [];
  }

  try {
    return await vectorStore.similaritySearch(query, 4, filter);
  } catch (error) {
    console.error("Vector search failed:", error);
    return [];
  }
}
