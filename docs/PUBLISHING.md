# Publishing AXIOM to GitHub Packages

This document is for the repository maintainer.

## 1. Create the GitHub repository

Create a public GitHub repository named `axiom` under the intended owner account or organization.

The repository URL used by the package manifests in this project is:

```text
https://github.com/GlydexStudio/axiom.git
```

If the owner or repository name changes, update the `repository` metadata in the package manifests before publishing.

## 2. Push the project

From the project root:

```bash
git init
git branch -M main
git add .
git commit -m "Initial AXIOM 0.1.0 release"
git remote add origin https://github.com/GlydexStudio/axiom.git
git push -u origin main
```

## 3. Configure GitHub Packages

The package manifests already use:

```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
}
```

They also use the `@glydexstudio` scope so the package namespace matches the GitHub owner used by this repository.

The publishing workflow requests:

```yaml
permissions:
  contents: read
  packages: write
```

## 4. Configure repository settings

Verify that GitHub Actions are enabled for the repository and that workflows are allowed to use `GITHUB_TOKEN`.

The included workflow uses the repository-provided token for publishing and does not require a manually stored PAT for normal release publishing.

## 5. Create a release

Update package versions consistently before a release.

For the first release, keep every workspace package on `0.1.0`.

Commit the version change, push it, then create a GitHub Release with a matching tag such as:

```text
v0.1.0
```

The `publish.yml` workflow runs when the release is published.

## 6. Trigger publishing

The workflow can run in two ways:

- automatically from a published GitHub Release
- manually with GitHub Actions → Publish AXIOM packages → Run workflow

The workflow always runs `npm run check` before publishing.

## 7. Verify published packages

After a successful run, open the repository's Packages section and verify the package versions.

The expected package set is:

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

## 8. Install packages from another project

Authenticate the consuming project with a GitHub Personal Access Token (classic) when required and configure:

```ini
@glydexstudio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Then install:

```bash
npm install @glydexstudio/axiom-core
```

Never put a literal token into a committed `.npmrc`.

## 9. Update package versions

Choose the next semantic version:

- patch: `0.1.1`
- minor: `0.2.0`
- major: `1.0.0`

Update every package that is released together and update `CHANGELOG.md`.

Because internal package dependencies reference concrete released versions, keep the versions synchronized for coordinated monorepo releases unless a package is intentionally released independently.

## 10. Publish a new version

1. Update package versions.
2. Update changelog.
3. Run `npm install`.
4. Run `npm run check`.
5. Commit and push.
6. Create and publish the GitHub Release with the matching tag.
7. Verify the Actions run.
8. Verify package versions on GitHub.

## 11. Handle a failed release

If the workflow fails:

1. Read the failing job step.
2. Fix the source or workflow issue.
3. Run `npm run check` locally.
4. Determine whether any package was already published.
5. Never republish an already existing version. Increment the version when a new package artifact is needed.
6. Create a new release/tag when appropriate.

Common causes include:

- invalid package metadata
- version already published
- permissions changed on the repository or organization
- package scope does not match the intended owner
- dependency version mismatch
- test/build failure

## 12. Rotate or revoke credentials

Normal Actions publishing uses `GITHUB_TOKEN`. If a maintainer creates a Personal Access Token for local package work, use a minimal classic token scope for the operation, store it outside the repository and revoke it when it is no longer needed.

Never commit a token. If a secret is exposed, revoke it immediately and review the repository history and package access logs.

## Local publishing test

For local testing, authenticate npm to GitHub Packages as the maintainer and publish only from the intended branch/release process. A typical scope mapping is:

```ini
@glydexstudio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Then publish a specific package:

```bash
npm publish --workspace packages/core
```

Do not use a development version that could collide with an existing published version.
