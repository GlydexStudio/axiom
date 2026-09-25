# AXIOM

<div align="center">

**AXIOM — The intelligence layer for any application.**

Open-source, modular, provider-agnostic AI orchestration for developers who want control over the intelligence layer inside their own products.

</div>

## What is AXIOM?

AXIOM is a TypeScript framework for composing AI capabilities into applications without making a commercial AI provider a hard dependency.

AXIOM is intentionally built around interfaces and orchestration rather than a single API wrapper. The runtime can combine a model, memory, tools, events, plugins and bounded agent execution while leaving model hosting and data persistence under the application's control.

### Core principles

- Open source and free to use
- Local-first by default
- Provider-agnostic model interface
- Modular packages
- Explicit tool permissions
- Privacy-conscious memory
- No mandatory commercial API key
- Production-oriented TypeScript
- Portable across Linux, Windows and macOS, with Node-compatible Android/Termux environments supported where the underlying Node ecosystem permits it

## Current implementation status

### Implemented in 0.1.0

- `@glydexstudio/axiom-core` — runtime orchestration, conversation history, model interface, bounded tool loop, events and plugins
- `@glydexstudio/axiom-memory` — in-memory conversation and key-value memory with namespaces/scopes
- `@glydexstudio/axiom-tools` — typed tool registry, JSON-schema subset validation and explicit permissions
- `@glydexstudio/axiom-providers` — Ollama adapter, OpenAI-compatible adapter and fallback router
- `@glydexstudio/axiom-agents` — bounded agent execution foundation using model tool calls
- `@glydexstudio/axiom-knowledge` — local lexical retrieval and vector-store abstraction with in-memory cosine similarity
- `@glydexstudio/axiom-vision` — provider-neutral vision contracts
- `@glydexstudio/axiom-voice` — provider-neutral speech contracts
- GitHub Actions CI and package publishing workflow
- Automated tests for the implemented runtime pieces

### Planned

The following are deliberately not presented as finished features:

- Durable database-backed memory adapters
- Native embedding provider implementations
- Production vector database adapters
- Advanced RAG pipelines, chunking and reranking
- More first-party commercial provider adapters
- Native embedded local model runtimes for supported platforms
- Vision and voice provider implementations
- Advanced routing policies based on latency, cost or model capability
- Broader observability integrations

## Package namespace

AXIOM uses the GitHub owner namespace `@glydexstudio/axiom-*` in this repository rather than claiming that the `@axiom/*` scope is available for publishing. GitHub Packages requires scoped npm packages, and scopes are tied to the GitHub user or organization that hosts the package.

The package names are therefore:

```text
@glydexstudio/axiom-core
@glydexstudio/axiom-memory
@glydexstudio/axiom-tools
@glydexstudio/axiom-agents
@glydexstudio/axiom-providers
@glydexstudio/axiom-knowledge
@glydexstudio/axiom-vision
@glydexstudio/axiom-voice
```

If the project is later moved to a different GitHub owner, rename the package scopes consistently before publishing that fork.

## Architecture

```text
Application
    │
    ▼
@glydexstudio/axiom-core
    ├── Model abstraction ────────────────► local / remote model runtime
    ├── Conversation orchestration
    ├── Memory integration ───────────────► @glydexstudio/axiom-memory
    ├── Tool orchestration ───────────────► @glydexstudio/axiom-tools
    ├── Events / hooks
    └── Plugin lifecycle

@glydexstudio/axiom-agents
    ├── goal
    ├── model planning / tool calls
    ├── explicit permissions
    ├── bounded execution
    └── observations → next step

@glydexstudio/axiom-knowledge
    ├── document retrieval
    ├── embedding abstraction
    └── vector store abstraction

@glydexstudio/axiom-vision / @glydexstudio/axiom-voice
    └── capability contracts for future provider implementations
```

The framework avoids a hard dependency on a vendor SDK in the core package.

## Requirements

- Node.js 22 or newer; Node.js 24 LTS is recommended for the 0.1.x development line.
- npm 10+ / npm 11+ is recommended.
- A TypeScript-capable development environment.
- A local model server or another implementation of `ChatModel` for actual model inference.

AXIOM itself does not need an OpenAI, Anthropic or Google API key.

## Installation

### From a local clone

```bash
git clone https://github.com/GlydexStudio/axiom.git
cd axiom
npm install
npm run check
```

### Using published GitHub Packages

After the packages have been published by the repository maintainer, configure npm for the `@glydexstudio` scope and install only the packages your application needs.

```bash
npm install @glydexstudio/axiom-core @glydexstudio/axiom-providers
```

See [Using AXIOM from GitHub Packages](#using-axiom-from-github-packages) for authentication details.

## Quick start

A minimal integration uses the provider abstraction. No vendor SDK is required in your application.

```ts
import { Axiom } from "@glydexstudio/axiom-core";
import { OllamaProvider } from "@glydexstudio/axiom-providers";

const axiom = new Axiom({
  model: new OllamaProvider({
    model: process.env.AXIOM_MODEL ?? "llama3.2"
  })
});

const result = await axiom.run("Explain why local-first AI can be useful.");
console.log(result.text);
```

The example assumes an Ollama server is already running and exposes the configured model. AXIOM does not install, manage or bundle Ollama itself.

## Local model usage

The preferred local-first pattern is to run the model outside AXIOM and connect through an adapter:

```ts
import { OpenAICompatibleProvider } from "@glydexstudio/axiom-providers";

const model = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:1234/v1",
  model: "your-local-model"
});
```

An API key is optional. This makes the provider suitable for local OpenAI-compatible servers and future custom runtimes that expose the same request contract.

For Ollama:

```ts
import { OllamaProvider } from "@glydexstudio/axiom-providers";

const model = new OllamaProvider({
  baseUrl: "http://127.0.0.1:11434",
  model: "your-local-model"
});
```

The Android/Termux story is deliberately HTTP-based: if a Node-compatible environment can reach a compatible model server, the same provider layer can be used without a desktop GUI.

## Provider architecture

The provider layer is based on the `ChatModel` contract:

```ts
import type { ChatModel } from "@glydexstudio/axiom-core";
```

The interface is intentionally small:

- provider name
- model name
- `generate(request)` for non-streaming inference
- optional `stream(request)` for streaming inference

This keeps vendor-specific authentication, HTTP formats and runtime quirks outside the core engine.

### Optional providers

`@glydexstudio/axiom-providers` currently contains:

- `OllamaProvider`
- `OpenAICompatibleProvider`
- `FallbackModelRouter`

Direct first-party adapters for specific commercial vendors are planned, not claimed as implemented.

## Memory

Memory is explicit and replaceable. AXIOM does not silently decide to persist arbitrary data in a remote service.

```ts
import { InMemoryMemoryStore } from "@glydexstudio/axiom-memory";

const memory = new InMemoryMemoryStore();
const axiom = new Axiom({
  model,
  memory,
  namespace: "my-app"
});

const conversationId = "user-123-chat-01";
await axiom.run("Remember that my preferred editor is Acode.", { conversationId });
const result = await axiom.run("Which editor did I mention?", { conversationId });
```

The 0.1.0 store is process-local. It provides:

- conversation messages
- namespaces
- conversation identifiers
- metadata
- a key-value memory interface

### Privacy

Do not persist sensitive data unless your application explicitly needs it and you have an appropriate data-handling policy. AXIOM exposes a persistence abstraction so you can choose encrypted, database-backed or ephemeral storage later rather than silently coupling the framework to a storage service.

## Tools

Tools are explicit functions that an AI model can request. Registration is type-safe and execution is permission-aware.

```ts
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
  execute: ({ a, b }: { a: number; b: number }) => a + b
});

const axiom = new Axiom({
  model,
  tools,
  toolPermissions: new Set(["read"])
});
```

AXIOM never gives a tool more permission than the application explicitly grants.

The built-in permission categories are:

```text
read
write
network
filesystem
process
```

Applications can keep permissions minimal. A tool that requires `filesystem` should not be exposed to a model running in a context where filesystem access is not wanted.

## Agents

`@glydexstudio/axiom-agents` provides a bounded execution loop around the same model/tool contracts used by the core runtime.

```ts
const agent = new AgentRunner({
  model,
  tools,
  permissions: new Set(["read"]),
  maxSteps: 6
});

const result = await agent.run("Use the available tools to collect the requested information.");
console.log(result.text);
```

The 0.1.0 agent implementation is intentionally bounded. It does not provide unrestricted background autonomy, arbitrary process execution or hidden persistence.

## Plugins

Plugins can extend AXIOM without editing the core package.

```ts
const auditPlugin = {
  name: "audit-log",
  version: "1.0.0",
  install(context) {
    context.on("tool:start", (event) => {
      console.log(`tool started: ${event.name}`);
    });
  }
};

await axiom.use(auditPlugin);
```

Plugin authors receive a limited context containing the tool registry, event subscription API and read-only configuration access.

The plugin system is intentionally small so that application developers can define their own plugin ecosystems without AXIOM taking control of their runtime.

## Knowledge and RAG foundation

`@glydexstudio/axiom-knowledge` is implemented as a foundation rather than an exaggerated "full RAG" claim.

Implemented:

- local document storage
- lexical retrieval
- embedding-provider interface
- vector-store interface
- in-memory cosine similarity vector store

Planned:

- chunking pipelines
- embedding provider adapters
- durable vector database integrations
- reranking
- citation-aware retrieval orchestration

Example:

```ts
import { LocalKnowledgeBase } from "@glydexstudio/axiom-knowledge";

const knowledge = new LocalKnowledgeBase();
knowledge.add({
  id: "docs-01",
  content: "AXIOM is local-first and provider-agnostic.",
  metadata: { source: "readme" }
});

const matches = knowledge.search("provider agnostic");
```

## Vision and voice

The vision and voice packages currently expose provider-neutral contracts so application code can be written against stable interfaces before a specific provider or local runtime is selected.

They intentionally do not contain fake inference or synthesized data.

## Configuration

AXIOM configuration is code-first. Environment variables are optional and are normally consumed by an application's provider setup, not by the core runtime.

Example `.env` values:

```dotenv
AXIOM_MODEL=your-local-model
AXIOM_BASE_URL=http://127.0.0.1:11434
AXIOM_API_KEY=
```

Never commit actual secrets. `.env.example` is intentionally tracked while `.env` and `.env.*` are ignored.

## Monorepo structure

```text
AXIOM/
├── packages/
│   ├── core/
│   ├── memory/
│   ├── tools/
│   ├── agents/
│   ├── providers/
│   ├── knowledge/
│   ├── vision/
│   └── voice/
├── examples/
│   ├── basic/
│   ├── tools/
│   ├── memory/
│   └── agents/
├── docs/
├── tests/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
├── tsconfig.base.json
└── tsconfig.json
```

## Development setup

```bash
npm install
npm run build
npm test
```

Or run the complete check:

```bash
npm run check
```

No GUI is required for the basic build and test workflow.

### Building on Termux / Android environments

The repository uses standard Node.js, TypeScript and npm workspace tooling. The core build is command-line only. Actual model inference remains a separate concern and can be provided by an HTTP model server reachable from the environment.

## Testing

The repository contains real tests for:

- core initialization and model abstraction
- tool registration and execution
- tool validation and permission errors
- memory operations
- provider request/response mapping
- knowledge retrieval and vector similarity
- configuration and error handling

Run:

```bash
npm test
```

## Examples

The repository includes working TypeScript examples for the implemented APIs. After `npm install` and `npm run build`, run them with a compatible local model server:

```bash
node --experimental-strip-types examples/basic/index.ts
node --experimental-strip-types examples/tools/index.ts
node --experimental-strip-types examples/memory/index.ts
node --experimental-strip-types examples/agents/index.ts
```

The examples use the local Ollama adapter by default and read `AXIOM_MODEL` when supplied.

## GitHub Packages

### Using AXIOM from GitHub Packages

GitHub Packages' npm registry uses scoped package names and supports authentication with a personal access token (classic). The exact token permissions depend on whether you are reading or publishing packages and on the visibility/access controls of the package.

For a user installing packages, the normal setup is:

1. Create a GitHub Personal Access Token (classic) with `read:packages` when authentication is required for the package.
2. Keep the token outside the repository.
3. Configure the `@glydexstudio` scope to use `https://npm.pkg.github.com`.
4. Give npm the token through an environment variable or user-level `.npmrc`.

Example user-level `.npmrc`:

```ini
@glydexstudio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Then install:

```bash
npm install @glydexstudio/axiom-core
npm install @glydexstudio/axiom-memory @glydexstudio/axiom-tools
npm install @glydexstudio/axiom-providers
```

For a private package, your GitHub account must have access to the package and the token must have the permissions needed to read it. Public package visibility is managed on GitHub; package visibility does not mean that an application should publish credentials in its source.

Never commit `.npmrc` files containing literal tokens. Prefer environment-variable expansion as shown above.

## Publishing to GitHub Packages

Maintainers use the included workflow at `.github/workflows/publish.yml`.

The workflow:

1. Runs on GitHub Release publication or manual dispatch.
2. Installs dependencies.
3. Builds and tests the monorepo.
4. Uses the GitHub Actions `GITHUB_TOKEN` with `packages: write`.
5. Publishes each workspace package to `https://npm.pkg.github.com`.
6. Does not hardcode a PAT or secret.

The complete maintainer procedure is documented in [docs/PUBLISHING.md](docs/PUBLISHING.md).

## Versioning

AXIOM follows semantic versioning:

```text
MAJOR.MINOR.PATCH
```

- MAJOR — breaking public API or package contract changes
- MINOR — backwards-compatible functionality
- PATCH — backwards-compatible bug fixes and maintenance

The repository starts at `0.1.0`, which means the public API is still allowed to evolve before 1.0.0. Breaking changes during the 0.x phase will still be called out clearly in the changelog and release notes.

## Roadmap

### 0.1.x

- Stabilize provider contracts
- Improve test coverage
- Add durable memory adapter interfaces
- Add more model capability metadata
- Expand plugin hooks

### 0.2.x

- Embedding adapters
- Persistent vector stores
- Retrieval pipelines and citations
- More local runtime adapters

### 0.3.x

- Richer agent planning abstractions
- Routing policies
- Observability hooks
- Vision / voice provider implementations

### 1.0.0

- Stable core API and compatibility policy
- Documented extension contracts
- Production-grade adapters for selected persistence and model runtimes

The roadmap is directional, not a claim that those features exist today.

## Security

Read [SECURITY.md](SECURITY.md) for reporting and operational guidance.

Key rules:

- never commit provider keys or tokens
- grant tools only the permissions they need
- treat plugins as executable code
- review local persistence and retention policies
- keep dependencies patched

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Contributions are welcome for code, tests, documentation, provider adapters, plugins and examples, provided that the contribution is explicit about what is implemented and what remains experimental.

## License

AXIOM is released under the MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Glydex Studio
