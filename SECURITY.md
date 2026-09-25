# Security Policy

## Supported versions

Security fixes are currently developed against the latest repository release. For production applications, use the latest compatible AXIOM release rather than an old unreleased checkout.

## Responsible disclosure

Please do not publish an exploitable security issue in a public issue before maintainers have had a reasonable opportunity to investigate it.

For sensitive reports, use the repository's private security reporting mechanism when available. Include:

- affected version
- affected package
- reproduction steps
- impact
- proof of concept where safe
- suggested mitigation if known

Do not include live credentials or private user data in reports.

## API keys and secrets

Never commit:

- OpenAI or other model-provider API keys
- GitHub tokens
- package registry tokens
- cloud credentials
- private certificates
- application secrets

Use environment variables or the secret-management system of your deployment environment.

The repository intentionally ignores `.env` and other common secret locations while keeping `.env.example` trackable.

## Tool permissions

AXIOM tools are executable code. A tool should request only the permissions it actually needs.

Examples:

- `read` for read-only application data
- `write` for state changes
- `network` for outbound network access
- `filesystem` for filesystem access
- `process` for launching or controlling processes

Applications should grant the smallest permission set possible.

## Plugin security

AXIOM plugins execute inside the application's process. A plugin is not a sandbox.

Only load plugins you trust, review their dependencies, and avoid granting a plugin access to secrets or privileged tools unless required.

## Local data

Local-first does not automatically mean private. Applications are responsible for:

- memory retention
- file permissions
- device encryption
- backups
- deletion policies
- logs and telemetry

Do not store sensitive information in memory or tool outputs unless the application has a deliberate policy for it.

## Dependency security

Keep dependencies updated and review security advisories. The repository includes Dependabot configuration as a maintenance aid but dependency updates should still be reviewed before merging.

## Security claims

AXIOM is not claiming security certifications, audits, formal verification or compliance attestations in this release.
