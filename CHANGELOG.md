# Changelog

<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**
and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

---

## [0.0.8] - 2026-09-28

### Added

- Initial tracked release

---

## Notes on versioning and releases

- We use **SemVer**:
  - **MAJOR** – breaking changes
  - **MINOR** – backward-compatible additions
  - **PATCH** – fixes, documentation, tooling
- Tag the repository with `vX.Y.Z` to publish a release.

## Release Procedure (Required)

Follow these steps exactly when creating a new release.

### One-Time Zenodo Authorization

1. Sign in to Zenodo.
2. Open your profile menu in the upper-right.
3. Select My account / Settings / GitHub.
4. In GitHub Repositories / Click **Sync now**.
5. Find this organization / this repo.
6. Turn on the repository toggle/slider.
7. Refresh the page and confirm it appears as enabled.
8. Zenodo will ingest future GitHub Releases from this repo.

### Task 1. Update release metadata (manual edits)

1.1. CHANGELOG.md: add section, move unreleased entries, update links
1.2. CITATION.cff: update version and date-released (version appears twice)
1.4. package.json: update version (near top of the file)
1.5. README.md badge
1.6. VERSION
1.7. docs/VERSION

### Task 2. Validate

Run:

```powershell

# Update dependency requirements in package.json.
npx --yes npm-check-updates -u

# Update installed dependencies and package-lock.json.
npm install

# Check installed dependencies for known vulnerabilities.
npm audit

# checks
npx depcheck
npx knip

# check individual files (optional)
node --check docs/index.js

# Check the syntax of every JavaScript file in docs.
Get-ChildItem docs -Recurse -File -Filter *.js | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) {
        throw "JavaScript syntax check failed: $($_.FullName)"
    }
}

# Apply available ESLint fixes.
npx eslint docs --fix

# Verify that the resulting JavaScript passes ESLint.
npx eslint docs


# Update GitHub Actions and pin all action references to immutable SHAs
uvx gha-tools autoupdate --pin=all --write .github/workflows

# Hooks
uvx prek update
git add -A
uvx prek run --all-files

# Then audit the resulting GitHub configuration for security findings
uvx zizmor@latest .github/

# validate files
uvx cffconvert --validate

# format markdown
npx markdownlint-cli2 --fix
```

Review all generated and modified files before committing.

### Task 3. Test GeoExplorer

Open the application locally using VS Code Live Server.

Verify:

- The application loads without JavaScript errors.
- U.S. state, county, and congressional district layers work.
- Minnesota precincts loads the latest published snapshot.
- Minnesota county and legislative district dropdowns populate.
- Selecting a county or district updates the map correctly.
- The displayed application version matches `docs/VERSION`.

For Minnesota precincts, GeoExplorer must read the published state
index and follow its `latest` metadata reference. No snapshot version
should be hard-coded in the application.

### Task 4. Commit and Push

```shell
git add -A
git commit -m "Prep X.Y.Z"
git push -u origin main
```

Verify that all required GitHub Actions complete successfully.

### Task 5. Tag and Push the Release

After the required GitHub Actions succeed:

```shell
git tag vX.Y.Z -m "X.Y.Z"
git push origin vX.Y.Z
```

Create GitHub Release after setting up Zenodo and pushing a tag,
for example with a command like this:

```shell
gh release create v1.1.2 --verify-tag --title "1.1.2"  --generate-notes
```

Then:

1. Confirm the GitHub Release was created successfully.
2. In Zenodo, confirm the GitHub release was ingested and archived.
3. Open the resulting Zenodo record and verify its metadata and DOI.

## Only As Needed (delete a tag)

```shell
git tag -d vX.Z.Y
git push origin :refs/tags/vX.Z.Y
```

## Links

[Unreleased]: https://github.com/civic-interconnect/cgeo-explorer/compare/v0.0.8...HEAD
[0.0.8]: https://github.com/civic-interconnect/geo-explorer/releases/tag/v0.0.8

<!-- markdownlint-enable MD024 -->
