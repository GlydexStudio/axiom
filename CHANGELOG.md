# Changelog

All notable changes to AXIOM are documented here.

## [0.1.0] - 2026-09-24

### Implemented
- TypeScript monorepo with npm workspaces and strict compilation.
- Core `Axiom` runtime with conversation orchestration, configurable memory, tool execution, plugins and typed events.
- Provider/model abstraction.
- Local HTTP model adapters for Ollama and OpenAI-compatible local/server runtimes.
- Fallback model router.
- In-memory short-term/conversation and key-value memory store with namespaces.
- Typed tool registry with JSON-schema subset validation and explicit permissions.
- Permission-aware agent execution foundation with bounded tool loops.
- Local lexical knowledge retrieval and vector-store abstraction with in-memory cosine similarity.
- Provider-neutral vision and voice capability contracts.
- Working examples and automated tests.
- GitHub Actions CI, package publishing workflow and Dependabot configuration.
- Maintainer and contributor documentation.

### Planned
- Durable database-backed memory adapters.
- Native embedding-provider adapters and production vector databases.
- Rich RAG pipelines with chunking, reranking and citation policies.
- Additional first-party commercial provider adapters.
- Native local model runtimes that run inside application processes where platform support permits.
- Vision and voice provider implementations.
- Advanced model routing, cost/latency policies and observability integrations.
