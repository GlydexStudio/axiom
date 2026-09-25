AXIOM Developer Guide

Welcome to AXIOM.

This guide explains how to install AXIOM, create your first application, connect a model, use memory and tools, and understand the basic runtime flow.

---

Prerequisites

You need:

- Node.js 22 or newer
- npm 10 or newer recommended
- TypeScript 5.8 or newer recommended

Node.js 24 is recommended for AXIOM development.

Verify your environment:

node --version
npm --version

---

Installation

For an application:

npm install @glydexstudio/axiom-core

If you also need the included providers:

npm install @glydexstudio/axiom-core @glydexstudio/axiom-providers

For memory:

npm install @glydexstudio/axiom-memory

For tools:

npm install @glydexstudio/axiom-tools

For agents:

npm install @glydexstudio/axiom-agents

For knowledge:

npm install @glydexstudio/axiom-knowledge

---

Your First AXIOM Application

Create:

src/index.ts

Example:

import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";

const model = new OllamaProvider({
  model: "llama3.2"
});

const axiom = new Axiom({
  model
});

const result = await axiom.run(
  "What is AXIOM?"
);

console.log(result.text);

Run it with a TypeScript-capable Node environment.

The model server must already be available.

---

Understanding the Runtime

A basic AXIOM request follows this flow:

Application
     │
     ▼
axiom.run()
     │
     ▼
Load memory
     │
     ▼
Build model request
     │
     ▼
ChatModel.generate()
     │
     ├── normal response ──► result
     │
     └── tool calls
              │
              ▼
        validate input
              │
              ▼
        check permissions
              │
              ▼
        execute tool
              │
              ▼
        return observation
              │
              ▼
        model again

The tool loop is bounded by configuration.

---

Using Memory

import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";

const memory = new InMemoryMemoryStore();

const axiom = new Axiom({
  model,
  memory
});

Use a conversation ID:

await axiom.run(
  "My name is Alex.",
  {
    conversationId: "conversation-1"
  }
);

const result = await axiom.run(
  "What is my name?",
  {
    conversationId: "conversation-1"
  }
);

Memory is optional.

Without a memory store, AXIOM does not persist conversations.

---

Using Tools

Create a registry:

import { ToolRegistry } from "@glydexstudio/axiom-tools";

const tools = new ToolRegistry();

Register a tool:

tools.register({
  name: "calculator",
  description: "Adds two numbers.",
  inputSchema: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" }
    },
    required: ["a", "b"],
    additionalProperties: false
  },
  permissions: ["read"],
  execute: ({ a, b }: { a: number; b: number }) => {
    return a + b;
  }
});

Connect it to AXIOM:

const axiom = new Axiom({
  model,
  tools,
  toolPermissions: new Set(["read"])
});

---

Permissions

Permissions are application-controlled.

new Set([
  "read"
]);

Multiple permissions:

new Set([
  "read",
  "network"
]);

Available categories:

read
write
network
filesystem
process

Do not grant a permission unless the application actually needs it.

---

Streaming

Check whether the model supports streaming:

if (!model.stream) {
  throw new Error("Model does not support streaming.");
}

Then:

for await (const event of axiom.stream(
  "Explain artificial intelligence."
)) {
  console.log(event);
}

Streaming input is validated in the same way as normal execution.

Empty input is rejected.

---

Agents

Agents are bounded model/tool loops.

import { AgentRunner } from "@glydexstudio/axiom-agents";

const agent = new AgentRunner({
  model,
  tools,
  permissions: new Set(["read"]),
  maxSteps: 5
});

const result = await agent.run(
  "Complete the requested task."
);

Always configure an appropriate step limit.

---

Custom Provider

A provider can implement the "ChatModel" interface.

import type {
  ChatModel,
  ModelRequest,
  ModelResponse
} from "@glydexstudio/axiom-core";

export class MyProvider implements ChatModel {
  readonly provider = "my-provider";
  readonly model = "my-model";

  async generate(
    request: ModelRequest
  ): Promise<ModelResponse> {
    // Send request to your model runtime.

    return {
      message: {
        role: "assistant",
        content: "Response"
      },
      toolCalls: [],
      finishReason: "stop"
    };
  }
}

Use it:

const axiom = new Axiom({
  model: new MyProvider()
});

This is the preferred extension point for new model runtimes.

---

Custom Tools

Tools are application-defined.

For example:

tools.register({
  name: "get_weather",
  description: "Returns the current weather.",
  inputSchema: {
    type: "object",
    properties: {
      city: {
        type: "string"
      }
    },
    required: ["city"],
    additionalProperties: false
  },
  permissions: ["network"],
  execute: async ({ city }: { city: string }) => {
    // Application-controlled network request.
    return {
      city,
      temperature: 20
    };
  }
});

AXIOM provides the orchestration layer.

Your application remains responsible for deciding what a tool actually does.

---

Plugins

Plugins can subscribe to events and extend application behavior.

const loggingPlugin = {
  name: "logging",
  version: "1.0.0",

  install(context) {
    context.on("run:start", event => {
      console.log("Run started:", event.conversationId);
    });

    context.on("run:finish", event => {
      console.log("Run finished:", event.conversationId);
    });
  }
};

await axiom.use(loggingPlugin);

---

Development Repository

Clone AXIOM:

git clone https://github.com/GlydexStudio/axiom.git
cd axiom

Install:

npm install

Build:

npm run build

Test:

npm test

Full verification:

npm run check

---

Repository Structure

packages/
    core/
    memory/
    tools/
    agents/
    providers/
    knowledge/
    vision/
    voice/

tests/
examples/
docs/
scripts/
.github/

Each package owns its own public API.

---

Working on a Package

Example:

packages/core/
├── src/
├── package.json
└── tsconfig.json

Source code belongs under:

packages/<package>/src/

Do not edit generated "dist/" output as source.

Build output is generated from TypeScript.

---

Testing Changes

Before submitting a change:

npm run check

Then run the extended local validation when available:

node behavior-test.mjs
node integration-test.mjs
node edge-stream-test.mjs

A change should not be considered complete until the affected behavior has been verified.

---

API Design Principles

When adding public functionality:

1. Prefer interfaces over vendor-specific implementations.
2. Keep dependencies directional.
3. Avoid unnecessary coupling between packages.
4. Validate user input.
5. Keep permissions explicit.
6. Keep agent execution bounded.
7. Do not hide network calls.
8. Do not silently persist application data.
9. Preserve backward compatibility where practical.
10. Add tests for new behavior.

---

Pull Requests

A good AXIOM pull request should explain:

- what changed
- why it changed
- which package is affected
- whether the public API changed
- what tests were added
- how the change was verified
- whether documentation was updated

Avoid mixing unrelated changes into one pull request.

---

Release Development

AXIOM packages are released as coordinated versions unless a package is intentionally released independently.

For a release:

1. Update versions
2. Update changelog
3. Run npm install
4. Run npm run check
5. Verify package metadata
6. Commit and push
7. Create GitHub Release
8. GitHub Actions publishes packages
9. Verify npm
10. Verify GitHub Packages

See:

docs/PUBLISHING.md

for the maintainer procedure.

---

Security

Never commit:

- API keys
- npm tokens
- GitHub tokens
- private model credentials
- production secrets

Use environment variables.

Example:

export AXIOM_API_KEY="..."

Do not place literal secrets in committed ".env" or ".npmrc" files.

---

Philosophy

AXIOM is intended to remain an orchestration layer.

It should not become:

- a mandatory cloud service
- a single-vendor SDK
- an unrestricted autonomous runtime
- a hidden telemetry system
- an opaque persistence layer

The application should remain in control.

AXIOM provides the intelligence layer. The developer provides the boundaries.
