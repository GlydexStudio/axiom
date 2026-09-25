import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";
import { ToolRegistry } from "@glydexstudio/axiom-tools";

const tools = new ToolRegistry();
tools.register({
  name: "calculator",
  description: "Adds two numbers.",
  inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"], additionalProperties: false },
  execute: ({ a, b }: { a: number; b: number }) => a + b
});

const axiom = new Axiom({
  model: new OllamaProvider({ model: process.env.AXIOM_MODEL ?? "llama3.2" }),
  tools,
  toolPermissions: new Set(["read"])
});

const result = await axiom.run("Use the calculator tool to add 19 and 23, then tell me the result.");
console.log(result.text);
