# AXIOM Architecture

## Design goal

AXIOM is an orchestration layer, not a model vendor and not a single API wrapper.

The dependency direction is designed to keep infrastructure replaceable:

```text
Application
   │
   ▼
Core orchestration
   ├── memory abstraction
   ├── tool abstraction
   ├── model abstraction
   ├── events
   └── plugins
        │
        ├── providers
        ├── agent runner
        └── future capability adapters
```

## Package responsibilities

### `core`

Owns the main runtime and the public orchestration API. It knows that models, memory stores and tools exist, but it does not know how a specific model provider or database works.

### `memory`

Defines memory contracts and provides local in-process implementations for development and small applications. Future adapters can target SQLite, files, embedded databases or server databases without changing the core API.

### `tools`

Owns tool registration, input validation, execution and explicit permissions. Keeping tools independent prevents the core runtime from becoming a giant collection of application-specific functions.

### `providers`

Translates AXIOM model requests into provider-specific transport. The 0.1 release contains local/OpenAI-compatible and Ollama adapters.

### `agents`

Provides a bounded loop around model tool calls. An agent is deliberately not a background daemon or unrestricted autonomous process.

### `knowledge`

Separates retrieval and vector contracts from model providers and application storage. The current release demonstrates local lexical retrieval and vector similarity without pretending that it is a complete production RAG system.

### `vision` / `voice`

Contain provider-neutral capability contracts. Implementations can be added without changing application code that depends only on the interfaces.

## Core execution flow

1. Application creates a `ChatModel` implementation.
2. Application optionally supplies memory and a `ToolRegistry`.
3. `Axiom.run()` loads conversation history.
4. The user message is added to the working context and persisted when a memory store exists.
5. The model is called with the current messages and tool definitions.
6. If tool calls are returned, AXIOM validates inputs and checks explicit permissions before execution.
7. Tool observations are added to the next model request.
8. The loop stops when the model returns a normal response or the configured round limit is reached.
9. The assistant response is persisted and returned to the application.

## Security boundaries

The framework intentionally does not grant a model raw filesystem, shell or network access. Any such capability must be exposed as an application-defined tool with a declared permission.

## Planned evolution

The architecture can grow toward:

- durable memory
- provider selection/routing policies
- embeddings and vector databases
- advanced planning
- structured output validation
- multimodal providers
- observability and tracing
- plugin registries

Those additions should preserve the interface-driven package boundaries established in 0.1.0.
