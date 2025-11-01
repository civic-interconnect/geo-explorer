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

- README.md badge
- VERSION
- docs/VERSION

Use the new release number in the commands below. 

```powershell
git pull
npx eslint --fix 
git add .
git commit -m "Prep vx.y.z"
git push -u origin main

git tag vx.y.z -m "x.y.z"
git push origin vx.y.z
```
