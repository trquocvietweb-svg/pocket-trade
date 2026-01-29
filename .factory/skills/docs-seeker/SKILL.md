---
name: docs-seeker
description: Find and extract technical documentation for libraries and frameworks using llms.txt, context7.com, GitHub Repomix, and web search. Use when user asks about documentation, wants to learn a library, needs API reference, asks "how to use X", "docs for Y", "find documentation", or needs code examples from repositories.
---

# Documentation Seeker

Find technical documentation quickly using multiple strategies: llms.txt standard, context7.com aggregator, GitHub repository analysis with Repomix, and web search fallback.

## When to use this Skill

Use when the user:
- Asks for documentation ("docs for Next.js", "Prisma documentation")
- Wants to learn a library ("how to use shadcn/ui")
- Needs API reference or examples
- Asks about a specific feature ("Next.js caching", "Prisma relations")
- Wants to analyze a GitHub repository for documentation
- Needs to compare libraries

## Quick start

**Fastest method** - Try context7.com first:

```
FetchUrl: https://context7.com/{org}/{repo}/llms.txt

Examples:
- Next.js: https://context7.com/vercel/next.js/llms.txt
- Prisma: https://context7.com/prisma/prisma/llms.txt
- shadcn/ui: https://context7.com/shadcn-ui/ui/llms.txt
```

**Topic-specific** - Add `?topic=` parameter:

```
FetchUrl: https://context7.com/shadcn-ui/ui/llms.txt?topic=date
FetchUrl: https://context7.com/vercel/next.js/llms.txt?topic=cache
```

**No llms.txt?** - Use Repomix:

```bash
git clone --depth 1 https://github.com/{org}/{repo} /tmp/docs
cd /tmp/docs && npx repomix --include "docs/**,README.md,*.md" --output docs.md
```

Then: `Read: /tmp/docs/docs.md`

## Instructions

### Step 1: Identify the library

Extract library/framework name from user request. Note any version requirements.

### Step 2: Try context7.com (fastest)

context7.com aggregates llms.txt for most popular libraries.

**For GitHub repositories:**
```
Pattern: https://context7.com/{org}/{repo}/llms.txt
```

**For websites:**
```
Pattern: https://context7.com/websites/{normalized-domain}/llms.txt
Example: docs.imgix.com → context7.com/websites/imgix/llms.txt
```

**For specific topics:**
```
Pattern: https://context7.com/{org}/{repo}/llms.txt?topic={query}
```

**Full documentation:**
```
Pattern: https://context7.com/{org}/{repo}/llms-full.txt
```

Action: `FetchUrl` the URL. If 404, go to Step 3.

### Step 3: Try official llms.txt

Common patterns:
- `https://docs.{library}.com/llms.txt`
- `https://{library}.dev/llms.txt`
- `https://{library}.io/llms.txt`

Action: `FetchUrl` the URL. If not found, go to Step 4.

### Step 4: Use Repomix for repository analysis

When no llms.txt available, analyze the GitHub repository directly.

**4a. Find repository:**
```
WebSearch: "{library} github repository official"
```

**4b. Clone repository:**
```bash
mkdir -p /tmp/docs-analysis
cd /tmp/docs-analysis
git clone --depth 1 https://github.com/{org}/{repo} .
```

**4c. Run Repomix:**
```bash
# Documentation only (recommended for large repos)
npx repomix --include "docs/**,README.md,*.md" --output docs.md

# Full repository (small repos <100MB)
npx repomix --exclude "node_modules/**,dist/**,*.lock" --output docs.md
```

**4d. Read and extract:**
```
Read: /tmp/docs-analysis/docs.md
```

Extract: Installation, usage, API reference, examples.

### Step 5: Web search fallback

When all else fails:
```
WebSearch: "{library} documentation official"
WebSearch: "{library} getting started guide"
WebSearch: "{library} API reference"
```

Then `FetchUrl` the found pages.

### Step 6: Present documentation

Format output as:

```markdown
# {Library} Documentation

## Source
- **Method**: llms.txt / Repomix / Web Search
- **URL**: {source}
- **Retrieved**: {date}

## Installation
{instructions}

## Quick Start
{example}

## API Reference
{methods}

## Examples
{code examples}

## Notes
{limitations or caveats}
```

## Examples

### Example 1: Library with llms.txt

User: "How do I use Prisma?"

```
1. FetchUrl: https://context7.com/prisma/prisma/llms.txt
   → Found! Contains doc URLs

2. FetchUrl: https://prisma.io/docs/getting-started
   → Extract installation and quick start

3. Present organized documentation
```

### Example 2: Topic-specific search

User: "How to use date picker in shadcn/ui?"

```
1. FetchUrl: https://context7.com/shadcn-ui/ui/llms.txt?topic=date
   → Returns only date-related docs

2. FetchUrl: https://ui.shadcn.com/docs/components/date-picker
   → Extract component usage

3. Present focused documentation
```

### Example 3: Repository analysis with Repomix

User: "Documentation for some-obscure-lib"

```
1. FetchUrl: https://context7.com/org/some-obscure-lib/llms.txt
   → 404 Not Found

2. WebSearch: "some-obscure-lib github official"
   → Found: github.com/org/some-obscure-lib

3. Execute: git clone --depth 1 https://github.com/org/some-obscure-lib /tmp/docs

4. Execute: cd /tmp/docs && npx repomix --include "docs/**,README.md" --output docs.md

5. Read: /tmp/docs/docs.md
   → Extract documentation

6. Present organized documentation
```

## Best practices

1. **Always try context7.com first** - Fastest, most reliable
2. **Use topic parameter** - `?topic=X` for focused results
3. **Shallow clone** - `--depth 1` saves time and bandwidth
4. **Focus Repomix** - Use `--include` to limit scope
5. **Note sources** - Always attribute where docs came from
6. **Note version** - Document which version the docs are for

## Popular libraries reference

| Library | context7.com URL |
|---------|------------------|
| Next.js | `context7.com/vercel/next.js/llms.txt` |
| React | `context7.com/facebook/react/llms.txt` |
| Vue | `context7.com/vuejs/core/llms.txt` |
| Svelte | `context7.com/sveltejs/svelte/llms.txt` |
| Prisma | `context7.com/prisma/prisma/llms.txt` |
| Drizzle | `context7.com/drizzle-team/drizzle-orm/llms.txt` |
| shadcn/ui | `context7.com/shadcn-ui/ui/llms.txt` |
| Tailwind | `context7.com/tailwindlabs/tailwindcss/llms.txt` |
| Hono | `context7.com/honojs/hono/llms.txt` |
| tRPC | `context7.com/trpc/trpc/llms.txt` |
| Laravel | `context7.com/laravel/framework/llms.txt` |
| Filament | `context7.com/filamentphp/filament/llms.txt` |

## Repomix quick reference

```bash
# Docs only
npx repomix --include "docs/**,README.md,*.md" --output docs.md

# TypeScript source
npx repomix --include "src/**/*.ts" --exclude "**/*.test.ts" --output src.md

# Python project
npx repomix --include "**/*.py,docs/**" --exclude "venv/**,**/__pycache__/**" --output docs.md

# Laravel project
npx repomix --include "app/**,routes/**,README.md" --exclude "vendor/**" --output docs.md
```

## Advanced usage

For detailed workflows and troubleshooting:
- [WORKFLOWS.md](./WORKFLOWS.md) - Step-by-step workflow examples
- [references/sources.md](./references/sources.md) - Documentation sources by ecosystem
- [references/troubleshooting.md](./references/troubleshooting.md) - Error handling and edge cases
