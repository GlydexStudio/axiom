AXIOM Development Guide

This document is for developers working on the AXIOM framework itself.

---

Development Environment

Recommended:

- Node.js 24
- npm 10+
- TypeScript 5.8+
- Git

AXIOM is developed as a TypeScript npm workspace monorepo.

---

Clone

git clone https://github.com/GlydexStudio/axiom.git
cd axiom

Install dependencies:

npm install

---

Workspace Structure

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
├── tests/
├── docs/
├── scripts/
├── .github/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
├── tsconfig.base.json
└── tsconfig.json

---

Package Responsibilities

Core

packages/core/

Contains:

- "Axiom"
- model contracts
- runtime orchestration
- events
- plugins
- runtime errors

Core should remain independent from vendor SDKs.

---

Memory

packages/memory/

Contains:

- memory interfaces
- message storage
- key-value memory
- in-memory implementations

Future storage adapters should implement existing contracts rather than modify the core runtime unnecessarily.

---

Tools

packages/tools/

Contains:

- tool registration
- tool lookup
- tool validation
- tool execution
- permission enforcement

Tools must remain explicit.

---

Agents

packages/agents/

Contains:

- bounded agent execution
- step limits
- tool-driven model execution

Agent behavior must remain bounded and observable.

---

Providers

packages/providers/

Contains provider-specific implementations.

Current providers include:

- Ollama
- OpenAI-compatible HTTP provider
- fallback model router

Provider-specific behavior should not leak into "axiom-core".

---

Knowledge

packages/knowledge/

Contains:

- document retrieval
- embeddings contracts
- vector-store contracts
- local vector implementations

Knowledge functionality should remain independent from a specific database vendor.

---

Vision

packages/vision/

Contains provider-neutral vision contracts.

Provider implementations can be added later.

---

Voice

packages/voice/

Contains provider-neutral voice contracts.

Provider implementations can be added later.

---

Dependency Direction

The architecture should generally follow:

Application
     │
     ▼
    Core
   / |  \
  /  |   \
Memory Tools Events
       │
       ▼
    Providers
       │
       ▼
 External model runtime

Higher-level packages may depend on lower-level contracts.

Vendor-specific packages should not become dependencies of the core runtime.

---

Public API

Only intentionally exported functionality should become part of the public API.

Before adding an export, consider:

- Is this intended for application developers?
- Can the API be maintained?
- Is the type stable enough?
- Does it expose implementation details?
- Does it require a vendor-specific dependency?

Avoid exporting internal helpers simply because they are useful during development.

---

Error Handling

AXIOM uses explicit errors for runtime failures.

Examples include:

- invalid input
- model errors
- tool errors
- tool loop limits
- provider failures
- invalid tool calls

Errors should preserve enough context for developers to diagnose failures without exposing secrets.

---

Tool Security

Tools represent application capabilities.

A tool should:

- declare its required permissions
- validate its input
- return predictable results
- avoid unnecessary side effects
- fail explicitly

Avoid tools that combine unrelated powerful capabilities.

For example, do not create a generic:

execute_anything

tool when several narrowly scoped tools would provide the required functionality.

---

Agent Safety

Agent execution must remain bounded.

When modifying agent behavior:

- preserve maximum step limits
- avoid unrestricted recursion
- avoid hidden side effects
- expose failures
- keep tool permissions explicit

An agent should never silently escalate its capabilities.

---

Streaming

Streaming implementations must support the "ModelStreamEvent" contract.

Provider implementations should:

1. establish the provider connection
2. parse provider-specific events
3. normalize events into AXIOM events
4. preserve ordering
5. surface transport errors
6. stop cleanly when aborted

Do not leak provider-specific streaming formats into "axiom-core".

---

Testing

Run:

npm test

Build:

npm run build

Full check:

npm run check

The full check is:

TypeScript build
        +
Official test suite

---

Test Categories

AXIOM testing should cover:

Unit behavior

Individual classes and functions.

Integration

Multiple AXIOM packages working together.

Edge cases

Invalid input, provider failures, tool failures, limits and malformed responses.

Streaming

Provider streaming parsing and AXIOM streaming behavior.

Public API

Imports from package entry points should work as documented.

---

Adding a Feature

Recommended workflow:

1. Identify the correct package
2. Define or reuse an interface
3. Implement the smallest coherent behavior
4. Add tests
5. Run TypeScript build
6. Run complete test suite
7. Update documentation
8. Update changelog when appropriate

Avoid putting unrelated functionality into "axiom-core".

---

Adding a Provider

Provider implementations belong in:

packages/providers/

A provider should implement the AXIOM model abstraction.

It should translate:

AXIOM ModelRequest
        │
        ▼
Provider request
        │
        ▼
External model runtime
        │
        ▼
Provider response
        │
        ▼
AXIOM ModelResponse

Provider-specific authentication belongs inside the provider implementation.

---

Adding a Memory Adapter

A future memory adapter should implement the memory interfaces.

Examples:

InMemoryMemoryStore
SQLiteMemoryStore
FileMemoryStore
PostgresMemoryStore

The application should be able to replace the implementation without rewriting "Axiom".

---

Documentation Rules

When changing public APIs:

- update README examples
- update relevant developer documentation
- update package documentation when necessary
- document breaking changes
- include usage examples for new functionality

Documentation should describe what exists today.

Do not document planned functionality as if it were implemented.

---

Versioning

AXIOM uses:

MAJOR.MINOR.PATCH

Coordinated releases currently use the same version across the AXIOM package family.

Example:

0.1.2

All packages released together should have compatible internal dependency versions.

---

Release Verification

Before a release:

npm install
npm run check

Verify package versions:

grep -R '"version": "0.1.2"' packages/*/package.json

Verify local package metadata:

for p in core memory tools agents providers knowledge vision voice; do
  npm pack --workspace "packages/$p" --dry-run
done

The tarball should contain the generated package files and metadata required by the package manifest.

---

Git Workflow

Use focused commits.

Examples:

feat(core): add streaming validation
fix(tools): normalize execution errors
test(core): cover empty streaming input
docs: improve developer guide
release: v0.1.2

Avoid commits that mix unrelated features.

---

Pull Requests

Before opening a PR:

npm run check

Then verify the changed behavior manually when appropriate.

A PR should include:

- summary
- technical details
- tests
- documentation changes
- compatibility impact

---

Design Principles

AXIOM development should preserve these principles:

Provider agnostic

Core should not depend on a specific AI vendor.

Explicit capabilities

Powerful operations must be exposed intentionally.

Local-first

Local execution should remain a first-class use case.

Replaceable infrastructure

Memory, models, providers and vector stores should remain replaceable.

Bounded execution

Agents and tool loops must have limits.

Transparent behavior

Network access, persistence and side effects should not be hidden.

Small public APIs

Prefer stable interfaces over large abstractions.

---

Android / Termux Development

AXIOM's core development workflow is command-line based.

A Node-compatible Android environment such as Termux can be used for repository work where the required Node packages support the device architecture.

Typical workflow:

git clone https://github.com/GlydexStudio/axiom.git
cd axiom
npm install
npm run check

The framework does not require a desktop IDE for its basic build and test workflow.

Actual model inference remains separate and depends on the model runtime and network environment.

---

Final Verification

A contributor should normally finish with:

npm run check
        │
        ├── TypeScript build
        └── Test suite

For changes affecting runtime behavior, also run the project's extended behavior and integration tests when available.

A green build is necessary, but documentation and behavioral verification are also part of a complete contribution.
