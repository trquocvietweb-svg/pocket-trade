# Advanced Workflows

Extended workflows and Repomix patterns for complex documentation discovery scenarios.

## Workflow: Version-Specific Documentation

```
# Clone specific tag/version
git clone --depth 1 --branch v14.0.0 https://github.com/vercel/next.js /tmp/docs
cd /tmp/docs && npx repomix --include "docs/**" --output docs-v14.md

# Note version in output
"Documentation for v14.0.0. Current latest may differ."
```

## Workflow: Compare Two Libraries

```
# Fetch both llms.txt
FetchUrl: https://context7.com/prisma/prisma/llms.txt
FetchUrl: https://context7.com/drizzle-team/drizzle-orm/llms.txt

# Fetch key pages from each, then present side-by-side comparison
```

## Workflow: Large Repository (>500MB)

```
# Option 1: Sparse checkout
git clone --depth 1 --filter=blob:none --sparse https://github.com/org/repo /tmp/docs
cd /tmp/docs && git sparse-checkout set docs

# Option 2: Include filter only
npx repomix --include "docs/**,README.md" --output docs.md

# Option 3: Split analysis
npx repomix --include "docs/getting-started/**" --output start.md
npx repomix --include "docs/api/**" --output api.md
```

## Workflow: Monorepo with Multiple Packages

```
# Identify specific package path
# Example: TanStack monorepo

# Analyze specific package
npx repomix --include "packages/query/**" --output query.md
npx repomix --include "packages/table/**" --output table.md
```

## Workflow: GitHub README Quick Fetch

```
# Direct raw content
FetchUrl: https://raw.githubusercontent.com/{org}/{repo}/main/README.md

# Convert blob URL to raw
github.com/org/repo/blob/main/docs/guide.md
→ raw.githubusercontent.com/org/repo/main/docs/guide.md
```

## Repomix Patterns by Project Type

### JavaScript/TypeScript
```bash
npx repomix \
  --include "src/**/*.ts,src/**/*.tsx,docs/**,README.md" \
  --exclude "**/*.test.ts,**/*.spec.ts,node_modules/**,dist/**" \
  --output docs.md
```

### Python
```bash
npx repomix \
  --include "src/**/*.py,docs/**,README.md,pyproject.toml" \
  --exclude "**/__pycache__/**,*.pyc,venv/**,.venv/**,**/*_test.py" \
  --output docs.md
```

### PHP/Laravel
```bash
npx repomix \
  --include "app/**,routes/**,config/**,database/**,README.md" \
  --exclude "vendor/**,storage/**,node_modules/**" \
  --output docs.md
```

### Rust
```bash
npx repomix \
  --include "src/**/*.rs,docs/**,README.md,Cargo.toml" \
  --exclude "target/**" \
  --output docs.md
```

### Go
```bash
npx repomix \
  --include "**/*.go,docs/**,README.md,go.mod" \
  --exclude "vendor/**,**/*_test.go" \
  --output docs.md
```

## Error Recovery

### context7.com returns 404
1. Try official llms.txt: `https://docs.{lib}.com/llms.txt`
2. Try variations: `{lib}.dev`, `{lib}.io`, `{lib}.org`
3. Fall back to Repomix

### Repository clone fails
1. Check if private (need auth)
2. Try shallow: `git clone --depth 1`
3. Try HTTPS instead of SSH
4. Fall back to WebSearch

### Repomix output too large
1. Focus: `--include "docs/**,README.md"`
2. Exclude more: `--exclude "*.png,*.jpg,*.gif,*.svg"`
3. Split into multiple runs
4. Use sparse checkout first

### Rate limited
1. Wait (GitHub: 1 hour for anonymous)
2. Try alternative sources
3. Note limitation in output

## Size Guidelines

| Repo Size | Strategy |
|-----------|----------|
| <50MB | Full Repomix |
| 50-200MB | Exclude binaries, focus on code |
| 200-500MB | Focus on docs/ only |
| >500MB | Sparse checkout + focused Repomix |
