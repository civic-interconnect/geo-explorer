# DEVELOPER.md


## Setup

1. Fork the repo.
2. Clone your fork and open it in VS Code.
3. Open a terminal (examples below use PowerShell on Windows).

```powershell
git clone https://github.com/civic-interconnect/geo-explorer.git
cd geo-explorer
```

Open docs/index.html in Live Server (VS Code Extension), e.g. <http://127.0.0.1:5500/docs/index.html>

## Before Starting Changes

```shell
git pull
```

## Releasing New Version

After verifying changes, update the version number in:

- pyproject.toml (if Python is used)
- README.md badge
- VERSION
- docs/VERSION

Use the new release number in the commands below. 

```powershell
git pull
git add .
git commit -m "Release v0.0.3"
git tag v0.0.3
git push origin main
git push origin v0.0.3
```
