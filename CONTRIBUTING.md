# Contributing to AXIOM

Thank you for helping improve AXIOM.

## Development setup

Requirements:

- Node.js 22+
- npm 10+
- Git

Clone and verify the repository:

```bash
git clone https://github.com/GlydexStudio/axiom.git
cd axiom
npm install
npm run check
```

No desktop GUI is required for the repository build, tests or documentation workflow.

## Repository structure

- `packages/core` — orchestration runtime
- `packages/memory` — memory abstractions and local store
- `packages/tools` — tool registry and permissions
- `packages/agents` — bounded agent execution
- `packages/providers` — model/provider adapters
- `packages/knowledge` — retrieval and vector abstractions
- `packages/vision` — vision capability contracts
- `packages/voice` — voice capability contracts
- `examples` — runnable usage examples
- `tests` — automated tests
- `docs` — contributor and maintainer documentation

## Coding standards

- Use strict TypeScript.
- Keep package boundaries explicit.
- Prefer small interfaces over deeply coupled classes.
- Avoid unnecessary dependencies.
- Do not put provider-specific code into `core`.
- Do not silently persist user data.
- Keep tool execution permission-aware.
- Throw meaningful errors for invalid configuration or input.
- Do not add fake implementations to make an API look complete.

## Tests

Every behavior change should include tests where practical.

Run the full suite:

```bash
npm test
```

Run build plus tests:

```bash
npm run check
```

## Pull requests

A good pull request should:

1. Explain the problem.
2. Describe the implementation.
3. Include tests for new behavior.
4. Update documentation when public APIs change.
5. Update `CHANGELOG.md` for user-visible changes.
6. Keep unrelated refactors out of the change.

## Issues

Use issues for reproducible bugs, focused feature requests and documentation problems.

Include:

- AXIOM version
- Node.js version
- operating system/environment
- package(s) involved
- minimal reproduction
- expected behavior
- actual behavior

Never publish secrets, API keys, private model prompts or private user data in an issue.

## Feature proposals

Feature proposals should explain:

- the developer problem being solved
- why it belongs in AXIOM rather than an application-specific package
- the proposed public API
- storage/privacy implications
- security implications
- compatibility impact

Large architectural work should start as a discussion or issue before a large implementation is submitted.

## Provider contributions

Provider adapters belong in `packages/providers` unless a provider is intentionally maintained in a separate repository.

Provider code should:

- implement the `ChatModel` contract
- keep secrets outside source code
- expose explicit configuration
- normalize vendor errors into useful AXIOM errors
- include request/response tests with mocked HTTP

## Plugin contributions

Plugins should avoid assuming filesystem, network or process access. If a plugin registers a tool with sensitive capabilities, its required permissions should be explicit.

## Documentation contributions

Documentation is part of the public API. Keep examples synchronized with actual code and do not document planned features as implemented.
