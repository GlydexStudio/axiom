import { AgentRunner } from "@glydexstudio/axiom-agents";
import { OllamaProvider } from "@glydexstudio/axiom-providers";
import { ToolRegistry } from "@glydexstudio/axiom-tools";

const tools = new ToolRegistry();
tools.register({
  name: "get_time",
  description: "Returns the current UTC time as an ISO timestamp.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  execute: () => new Date().toISOString()
});

const agent = new AgentRunner({
  model: new OllamaProvider({ model: process.env.AXIOM_MODEL ?? "llama3.2" }),
  tools,
  permissions: new Set(["read"]),
  maxSteps: 4
});

const result = await agent.run("Find the current UTC time using the available tool and report it.");
console.log(result.text);
