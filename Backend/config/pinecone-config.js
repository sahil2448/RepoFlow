import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const pinecone = new Pinecone({
  apiKey:
    process.env.PINECONE_API_KEY ||
    // Never throw at import when the key is missing (CI/tests): the Pinecone
    // constructor validates that apiKey is *present*, not that it is valid.
    // Production always supplies the real key via .env.
    "repoflow-development-invalid-key",
});

export const index = pinecone.index(process.env.PINECONE_INDEX);
export default pinecone;
