AXIOM

<div align="center">The intelligence layer for any application.

Open-source, modular, provider-agnostic AI orchestration for developers who want control over the intelligence layer inside their own applications.

""npm" (https://img.shields.io/npm/v/@glydexstudio/axiom-core?label=npm)" (https://www.npmjs.com/package/@glydexstudio/axiom-core)
""GitHub Release" (https://img.shields.io/github/v/release/GlydexStudio/axiom)" (https://github.com/GlydexStudio/axiom/releases)
""License" (https://img.shields.io/badge/license-MIT-green)" (LICENSE)
""Node" (https://img.shields.io/badge/node-%3E%3D22-339933)" (https://nodejs.org/)

</div>---

What is AXIOM?

AXIOM is a modular TypeScript framework for building AI-powered applications without coupling your application to a single AI vendor, model provider, memory backend, or execution environment.

Instead of being another model SDK, AXIOM provides the intelligence layer around your application:

- model abstraction
- conversation orchestration
- memory
- tools
- permissions
- agents
- knowledge retrieval
- events
- plugins
- vision and voice capability contracts
- provider routing

Your application controls the infrastructure.

AXIOM controls the orchestration.

┌──────────────────────────────────────────┐
│              Your Application             │
├──────────────────────────────────────────┤
│                  AXIOM                    │
│                                          │
│  Core ─ Memory ─ Tools ─ Agents          │
│         │        │        │               │
│  Providers ─ Knowledge ─ Plugins          │
│         │                                  │
│  Vision / Voice capability contracts      │
├──────────────────────────────────────────┤
│       Local / Remote AI Infrastructure    │
└──────────────────────────────────────────┘

---

Why AXIOM?

AXIOM is designed around a few principles:

- Open source
- Provider agnostic
- Local-first
- Modular
- Explicit permissions
- Replaceable infrastructure
- No mandatory commercial AI API
- TypeScript-first
- Application-controlled memory
- Bounded agent execution

AXIOM does not require your application to use a specific commercial AI provider.

You can connect a local model, an OpenAI-compatible server, Ollama, or your own "ChatModel" implementation.

---

Current release

AXIOM "0.1.2"

The "0.1.x" series is an actively evolving foundation. Public APIs may continue to evolve before the "1.0.0" stability milestone.

Implemented

Package| Purpose
"@glydexstudio/axiom-core"| Runtime orchestration, models, memory integration, tools, events and plugins
"@glydexstudio/axiom-memory"| Memory contracts and in-memory storage
"@glydexstudio/axiom-tools"| Tool registry, validation and permissions
"@glydexstudio/axiom-agents"| Bounded agent execution
"@glydexstudio/axiom-providers"| Ollama, OpenAI-compatible providers and fallback routing
"@glydexstudio/axiom-knowledge"| Local retrieval and vector-store abstractions
"@glydexstudio/axiom-vision"| Provider-neutral vision contracts
"@glydexstudio/axiom-voice"| Provider-neutral voice contracts

Current status

The following are intentionally not claimed as complete production implementations yet:

- durable database-backed memory
- production vector database adapters
- advanced RAG pipelines
- reranking
- native embedding providers
- broad commercial provider coverage
- native local model runtimes
- production vision inference providers
- production voice inference providers
- advanced model routing policies
- distributed agent execution

---

Packages

AXIOM is distributed as independent npm packages.

@glydexstudio/axiom-core
@glydexstudio/axiom-memory
@glydexstudio/axiom-tools
@glydexstudio/axiom-agents
@glydexstudio/axiom-providers
@glydexstudio/axiom-knowledge
@glydexstudio/axiom-vision
@glydexstudio/axiom-voice

Install only what your application needs.

For most applications, start with:

npm install @glydexstudio/axiom-core @glydexstudio/axiom-providers

---

Requirements

- Node.js "22+"
- Node.js "24" recommended
- npm "10+" recommended
- TypeScript "5.8+" recommended

AXIOM itself does not require an OpenAI, Anthropic, Google or other commercial API key.

Actual inference depends on the model provider you connect.

---

Quick Start

1. Install

npm install @glydexstudio/axiom-core @glydexstudio/axiom-providers

2. Connect a model

For example, using Ollama:

import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";

const model = new OllamaProvider({
  model: "llama3.2"
});

const axiom = new Axiom({
  model
});

3. Run AXIOM

const result = await axiom.run(
  "Explain why local-first AI can be useful."
);

console.log(result.text);

AXIOM does not install or manage Ollama for you. The model runtime remains an external infrastructure component.

---

OpenAI-Compatible Models

AXIOM also supports OpenAI-compatible HTTP APIs.

import { OpenAICompatibleProvider } from "@glydexstudio/axiom-providers";

const model = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:1234/v1",
  model: "your-local-model"
});

An API key can be supplied when the server requires authentication.

const model = new OpenAICompatibleProvider({
  baseUrl: "https://your-server.example/v1",
  model: "your-model",
  apiKey: process.env.AXIOM_API_KEY
});

The provider abstraction keeps provider-specific HTTP details outside the AXIOM core runtime.

---

Custom Models

You can implement the "ChatModel" interface yourself.

import type {
  ChatModel,
  ModelRequest,
  ModelResponse
} from "@glydexstudio/axiom-core";

class MyModel implements ChatModel {
  readonly provider = "my-provider";
  readonly model = "my-model";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    // Your model implementation
    return {
      message: {
        role: "assistant",
        content: "Hello from my model."
      },
      toolCalls: [],
      finishReason: "stop"
    };
  }
}

Then:

const axiom = new Axiom({
  model: new MyModel()
});

This is one of the central design goals of AXIOM: your application should not need to depend on a vendor SDK just to use the orchestration layer.

---

Memory

Memory is explicit and replaceable.

import { Axiom } from "@glydexstudio/axiom-core";
import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";

const memory = new InMemoryMemoryStore();

const axiom = new Axiom({
  model,
  memory,
  namespace: "my-app"
});

await axiom.run(
  "My preferred editor is Acode.",
  {
    conversationId: "conversation-1"
  }
);

const result = await axiom.run(
  "Which editor did I mention?",
  {
    conversationId: "conversation-1"
  }
);

console.log(result.text);

The in-memory implementation is process-local.

AXIOM intentionally does not silently send application memory to a remote service.

Future memory adapters can target:

- SQLite
- files
- embedded databases
- SQL databases
- remote databases
- encrypted storage

---

Tools

Tools allow models to request application-defined operations.

import { ToolRegistry } from "@glydexstudio/axiom-tools";

const tools = new ToolRegistry();

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

Connect the registry:

const axiom = new Axiom({
  model,
  tools,
  toolPermissions: new Set(["read"])
});

AXIOM validates tool input and checks the permissions granted by the application before execution.

---

Tool Permissions

AXIOM currently defines these permission categories:

read
write
network
filesystem
process

Permissions are explicit.

For example:

toolPermissions: new Set([
  "read",
  "network"
])

A model does not automatically receive filesystem, process, network or write access.

Capabilities must be exposed by the application through tools.

---

Streaming

Models can optionally expose streaming.

if (!model.stream) {
  throw new Error("Streaming is not supported.");
}

for await (const event of axiom.stream("Tell me a story.")) {
  console.log(event);
}

AXIOM validates empty or whitespace-only input consistently across normal and streaming execution.

---

Agents

"@glydexstudio/axiom-agents" provides bounded agent execution.

import { AgentRunner } from "@glydexstudio/axiom-agents";

const agent = new AgentRunner({
  model,
  tools,
  permissions: new Set(["read"]),
  maxSteps: 6
});

const result = await agent.run(
  "Use the available tools to collect the requested information."
);

console.log(result.text);

Agent execution is intentionally bounded.

AXIOM does not provide unrestricted autonomous background execution.

---

Knowledge

"@glydexstudio/axiom-knowledge" provides the foundation for retrieval systems.

Current capabilities include:

- local document storage
- lexical search
- embedding interfaces
- vector-store interfaces
- in-memory cosine similarity

Example:

import { LocalKnowledgeBase } from "@glydexstudio/axiom-knowledge";

const knowledge = new LocalKnowledgeBase();

knowledge.add({
  id: "document-1",
  content: "AXIOM is provider-agnostic.",
  metadata: {
    source: "documentation"
  }
});

const results = knowledge.search(
  "provider agnostic"
);

console.log(results);

AXIOM does not currently claim to provide a complete production RAG pipeline.

---

Events

The core runtime exposes events that applications and plugins can subscribe to.

const unsubscribe = axiom.on(
  "tool:start",
  (event) => {
    console.log("Tool started:", event.name);
  }
);

Remove the listener when it is no longer required:

unsubscribe();

Events are useful for:

- logging
- UI updates
- debugging
- telemetry
- application integrations
- plugin systems

---

Plugins

Plugins extend AXIOM without modifying the core package.

const plugin = {
  name: "audit-plugin",
  version: "1.0.0",

  install(context) {
    context.on("tool:start", event => {
      console.log(`Tool started: ${event.name}`);
    });
  }
};

await axiom.use(plugin);

Plugins receive a controlled context rather than unrestricted access to the runtime.

---

Vision and Voice

The vision and voice packages currently expose provider-neutral contracts.

@glydexstudio/axiom-vision
@glydexstudio/axiom-voice

These packages are intentionally interfaces/contracts at this stage.

They do not pretend to provide local vision or speech inference when an actual provider implementation is not present.

This allows application developers to build against stable capability abstractions before selecting a specific runtime.

---

Architecture

                         Your Application
                                │
                                ▼
                    ┌─────────────────────┐
                    │   AXIOM Core        │
                    │                     │
                    │ Runtime             │
                    │ Models              │
                    │ Memory integration  │
                    │ Tools               │
                    │ Events              │
                    │ Plugins             │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
      Providers             Agents             Knowledge
          │                    │                    │
     Ollama              bounded loop          retrieval
     OpenAI-compatible   tool calls            vectors
     fallback router     permissions           embeddings
          │
          ▼
    Local / Remote
      AI runtime

The core package does not contain vendor-specific model transport.

---

Monorepo

axiom/
├── packages/
│   ├── core/
│   ├── memory/
│   ├── tools/
│   ├── agents/
│   ├── providers/
│   ├── knowledge/
│   ├── vision/
│   └── voice/
│
├── examples/
├── docs/
├── tests/
├── scripts/
├── .github/
│   └── workflows/
│
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
├── tsconfig.base.json
└── tsconfig.json

---

Development

Clone the repository:

git clone https://github.com/GlydexStudio/axiom.git
cd axiom

Install dependencies:

npm install

Run the complete verification:

npm run check

Build only:

npm run build

Run tests only:

npm test

More information:

- "Developer Guide" (docs/GETTING_STARTED.md)
- "Development Guide" (docs/DEVELOPMENT.md)
- "Architecture" (docs/ARCHITECTURE.md)
- "Plugin Authoring" (docs/PLUGIN_AUTHORING.md)
- "Publishing" (docs/PUBLISHING.md)
- "Contributing" (CONTRIBUTING.md)
- "Security" (SECURITY.md)

---

Testing

AXIOM maintains automated coverage for the implemented runtime.

The verification suite covers:

- core runtime initialization
- model abstraction
- tool registration
- tool validation
- permissions
- memory
- provider behavior
- provider errors
- knowledge retrieval
- vector similarity
- streaming
- agent limits
- configuration
- edge cases

Run:

npm run check

The "0.1.2" release was validated with:

12/12 official tests passing
Behavior tests passing
Integration tests passing
Edge + streaming tests passing
TypeScript build passing

---

Versioning

AXIOM follows semantic versioning:

MAJOR.MINOR.PATCH

PATCH

Bug fixes and maintenance changes.

0.1.1 → 0.1.2

MINOR

Backwards-compatible functionality.

0.1.x → 0.2.0

MAJOR

Breaking public API or package contract changes.

0.x → 1.0.0

During the "0.x" phase, APIs may still evolve before the framework reaches its stable "1.0.0" milestone.

---

Roadmap

0.1.x

- stabilize core contracts
- expand test coverage
- improve provider support
- improve memory abstractions
- expand plugin hooks
- improve developer documentation

0.2.x

- embedding adapters
- persistent vector stores
- retrieval pipelines
- citations
- more local runtime integrations

0.3.x

- richer agent planning
- routing policies
- observability
- vision implementations
- voice implementations

1.0.0

- stable public API
- compatibility policy
- documented extension contracts
- production-grade selected adapters

The roadmap is directional and does not represent features that are already implemented.

---

Security

AI tools can expose powerful application capabilities.

Applications should:

- grant the minimum required permissions
- validate tool inputs
- avoid exposing unnecessary filesystem/process capabilities
- protect provider credentials
- review plugins before installation
- define appropriate memory retention policies
- keep dependencies updated

For security reports, see "SECURITY.md" (SECURITY.md).

---

Contributing

Contributions are welcome.

You can contribute:

- code
- tests
- documentation
- provider adapters
- memory adapters
- knowledge integrations
- plugins
- examples
- bug reports
- feature proposals

Read "CONTRIBUTING.md" (CONTRIBUTING.md) before submitting a contribution.

---

License

AXIOM is released under the MIT License.

See "LICENSE" (LICENSE).

Copyright © 2026 Glydex Studio

---

<div align="center">AXIOM

The intelligence layer for any application.

</div>
