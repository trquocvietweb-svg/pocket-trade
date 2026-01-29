# Troubleshooting Guide

Error handling, edge cases, and recovery strategies.

## Common Errors

### context7.com Returns 404

**Cause**: Library not indexed yet or wrong URL pattern.

**Resolution**:
```
1. Verify URL pattern:
   ✓ context7.com/vercel/next.js/llms.txt
   ✗ context7.com/nextjs/llms.txt (missing org)

2. Try official llms.txt:
   FetchUrl: https://docs.{library}.com/llms.txt
   FetchUrl: https://{library}.dev/llms.txt

3. Fall back to Repomix:
   Clone repo → npx repomix → Read output
```

---

### Repository Clone Fails

**Symptoms**: Git errors, timeout, permission denied.

**Resolution**:
```
# Authentication required (private repo)
→ Inform user repo is private
→ Search for public mirrors or forks

# Timeout/slow connection
→ Use shallow clone: git clone --depth 1

# SSL/HTTPS issues
→ Try: git clone https://github.com/...
→ Or: GIT_SSL_NO_VERIFY=true git clone ...

# Disk space
→ Clone to /tmp (usually has space)
→ Clean up after: rm -rf /tmp/docs-analysis
```

---

### Repomix Fails or Hangs

**Cause**: Repository too large, binary files, memory issues.

**Resolution**:
```
# Check size first
du -sh /tmp/docs-analysis
# If >500MB, use focused approach

# Focus on docs only
npx repomix --include "docs/**,README.md,*.md" --output docs.md

# Exclude problematic files
npx repomix \
  --exclude "*.png,*.jpg,*.gif,*.svg,*.ico,*.mp4,*.pdf" \
  --exclude "node_modules/**,vendor/**,.git/**" \
  --exclude "dist/**,build/**,coverage/**" \
  --output clean.md

# For very large repos, analyze specific directories
npx repomix --include "src/core/**" --output core.md
npx repomix --include "docs/**" --output docs.md

# If still fails, manual exploration
Read: /tmp/docs-analysis/README.md
LS: /tmp/docs-analysis/docs
Read: /tmp/docs-analysis/docs/getting-started.md
```

---

### Rate Limiting (429 Error)

**Cause**: Too many requests in short time.

**Resolution**:
```
# GitHub API (anonymous): 60 requests/hour
# Wait period: Usually 1 hour

1. Switch to alternative source immediately
2. Use cached content if available
3. Try different approach (Repomix instead of API)
4. Note limitation in output

# Report to user
"Rate limited by {source}. Using alternative method..."
```

---

### FetchUrl Timeout

**Cause**: Slow server, large page, network issues.

**Resolution**:
```
1. Retry once (may be temporary)
2. Try alternative URL:
   - Different subdomain (docs.X.com vs X.com/docs)
   - Raw GitHub instead of rendered
   - CDN/mirror if available
3. Fall back to WebSearch for alternatives
4. Note partial results if some pages succeeded
```

---

### Output Too Large to Process

**Cause**: Repomix output exceeds context limits.

**Resolution**:
```
# Check file size
ls -lh repomix-output.md
# If >1MB, too large

# Create focused outputs
npx repomix --include "README.md" --output readme.md
npx repomix --include "docs/getting-started.md" --output start.md
npx repomix --include "docs/api/**" --output api.md

# Read separately and synthesize
Read: /tmp/docs-analysis/readme.md
Read: /tmp/docs-analysis/start.md
Read: /tmp/docs-analysis/api.md
```

---

### Documentation in Non-English

**Cause**: Library primarily documents in another language.

**Resolution**:
```
1. Check for /en/ or English version:
   FetchUrl: https://docs.library.com/en/
   
2. Look for community translations:
   WebSearch: "{library} documentation english"
   
3. Check GitHub README (usually English):
   FetchUrl: https://raw.githubusercontent.com/org/repo/main/README.md
   
4. Note language in output:
   "Primary docs in Japanese. English README provided."
```

---

### Documentation Behind Authentication

**Cause**: Enterprise docs, premium content, internal wikis.

**Resolution**:
```
1. Search for public alternatives:
   WebSearch: "{library} public documentation"
   
2. Check package registry:
   FetchUrl: https://npmjs.com/package/{name}
   
3. Analyze public repository if available:
   Clone + Repomix
   
4. Report limitation:
   "Documentation requires authentication.
   Public sources used: README, package info."
```

---

### Conflicting Information

**Cause**: Different versions, outdated docs, community vs official.

**Resolution**:
```
1. Identify versions of each source
2. Prioritize:
   - Official docs (latest)
   - Official docs (user's version)
   - Package registry
   - Repository README
   - Community (recent, verified)

3. Present both if significant:
   "## Method A (Official v2.x)
   [new approach]
   
   ## Method B (Legacy v1.x)
   [old approach]
   
   Note: Use v2.x for new projects."
```

---

### Deprecated/Archived Library

**Cause**: Project no longer maintained.

**Resolution**:
```
1. Check for archived status:
   WebSearch: "{library} deprecated alternative"
   
2. Use Wayback Machine:
   FetchUrl: https://web.archive.org/web/*/docs.library.com
   
3. Check repository for migration guide:
   Look for MIGRATION.md, DEPRECATED.md
   
4. Report status:
   "⚠️ Library deprecated since {date}.
   Recommended alternative: {new-library}
   Legacy docs: {archived-url}"
```

---

## Edge Cases

### Monorepo with Multiple Packages

```
# Example: TanStack (query, table, router, etc.)
1. Identify specific package user needs
2. Focus Repomix on that package:
   npx repomix --include "packages/query/**" --output query.md

# Or try package-specific llms.txt
context7.com/TanStack/query/llms.txt
```

### Documentation Split Across Sites

```
# Example: Library with separate API docs and guides
1. Fetch multiple sources:
   FetchUrl: https://library.dev/docs/guide
   FetchUrl: https://api.library.dev/reference

2. Synthesize in output:
   "Sources: Guide from library.dev, API from api.library.dev"
```

### Version-Specific Documentation

```
# Tagged versions in git
git clone --depth 1 --branch v2.0.0 https://github.com/org/repo

# Versioned docs URLs
FetchUrl: https://docs.library.com/v2.0/
FetchUrl: https://v2.docs.library.com/

# Always note version
"Documentation for v2.0.0. Current latest: v3.x"
```

### Beta/Canary Documentation

```
# Check for beta docs
FetchUrl: https://beta.docs.library.com/
FetchUrl: https://docs.library.com/canary/

# Or canary branch
git clone -b canary https://github.com/org/repo

# Warn user
"⚠️ Beta documentation - may change before release"
```

---

## Quality Checklist

Before presenting results, verify:

- [ ] **Accuracy**: Information matches official sources
- [ ] **Version**: Correct version documented
- [ ] **Completeness**: Key topics covered (install, usage, API)
- [ ] **Attribution**: Sources clearly listed
- [ ] **Limitations**: Gaps and caveats noted
- [ ] **Formatting**: Code blocks, headers, links work

---

## Output Templates

### Successful Discovery
```markdown
# {Library} Documentation

## Source
- **Method**: llms.txt via context7.com
- **URL**: context7.com/{org}/{repo}/llms.txt
- **Retrieved**: {date}

## Installation
{content}

## Quick Start
{content}

## API Reference
{content}
```

### Partial Results
```markdown
# {Library} Documentation

## Source
- **Method**: Repomix (no llms.txt available)
- **Repository**: github.com/{org}/{repo}
- **Retrieved**: {date}

## ⚠️ Limitations
- API reference incomplete (not in repo docs)
- Examples from tests only

## Available Documentation
{content}

## Additional Resources
- Official site: {url} (requires auth)
- Community tutorial: {url}
```

### Cannot Find Documentation
```markdown
# {Library} Documentation

## ⚠️ Limited Documentation Available

Searched:
- context7.com: Not found
- Official llms.txt: Not found
- GitHub repository: Not found / Private

## Available Information
From package registry ({url}):
{description}

## Recommendation
- Check official website: {url}
- Contact maintainers
- Look for community resources
```

---

## Performance Tips

1. **Try context7.com first** - Skip searching
2. **Use topic parameter** - `?topic=X` for focused results
3. **Shallow clone** - `--depth 1` saves 90%+ time
4. **Focus Repomix** - Use `--include` patterns
5. **Cache within session** - Don't re-fetch same content
6. **Fail fast** - Don't retry failed methods repeatedly
7. **Check size before Repomix** - `du -sh` first
