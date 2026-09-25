import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";

const model = new OllamaProvider({ model: process.env.AXIOM_MODEL ?? "llama3.2" });
const axiom = new Axiom({ model, systemPrompt: "You are a concise assistant." });
const result = await axiom.run("Explain what AXIOM does in one sentence.");
console.log(result.text);
