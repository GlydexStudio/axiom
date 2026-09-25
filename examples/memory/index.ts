import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";
import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";

const memory = new InMemoryMemoryStore();
const axiom = new Axiom({
  model: new OllamaProvider({ model: process.env.AXIOM_MODEL ?? "llama3.2" }),
  memory,
  namespace: "demo"
});

const conversationId = "memory-example";
await axiom.run("My favorite color is blue.", { conversationId });
const result = await axiom.run("What is my favorite color?", { conversationId });
console.log(result.text);
