# AI Release Notes Generator

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github)](https://github.com/features/actions)
[![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange)](https://www.anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Ship faster. Write better release notes. Automatically.**

Transform your merged PRs into polished, human-readable release notes with Claude AI. No more manual changelog writing, no more inconsistent formats, no more forgotten updates.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Merged PRs    │────▶│  GitHub Action  │────▶│    Claude AI    │
│  since v1.2.0   │     │   (triggered)   │     │  (summarizes)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌───────────────────────────────────────────┐
                        │           Release Notes Output            │
                        ├─────────────┬─────────────┬───────────────┤
                        │   GitHub    │    Slack    │    Notion     │
                        │  Releases   │   Channel   │   Database    │
                        └─────────────┴─────────────┴───────────────┘
```

## Quick Start

### 1. Copy the workflow file

```bash
mkdir -p .github/workflows
curl -o .github/workflows/release-notes.yml \
  https://raw.githubusercontent.com/christiancaviedes/ai-release-notes-generator/main/.github/workflows/release-notes.yml
```

### 2. Add secrets to your repository

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Claude API key from [console.anthropic.com](https://console.anthropic.com) |
| `SLACK_WEBHOOK_URL` | No | Incoming webhook URL for Slack notifications |
| `NOTION_TOKEN` | No | Notion integration token for database updates |
| `NOTION_DATABASE_ID` | No | Target Notion database ID |

### 3. Configure outputs (optional)

Create `.github/release-notes-config.yml` in your repo:

```yaml
# Customize your release notes
sections:
  - breaking_changes
  - features
  - fixes
  - performance
  - documentation
  - dependencies

tone: professional  # professional | casual | technical

outputs:
  github: true
  slack: true
  notion: false

labels:
  features: ["feature", "enhancement", "feat"]
  fixes: ["bug", "fix", "bugfix"]
  breaking_changes: ["breaking", "breaking-change"]
  dependencies: ["dependencies", "deps"]
```

### 4. Trigger release notes

**Option A:** Push a tag
```bash
git tag v1.3.0
git push origin v1.3.0
```

**Option B:** Manual dispatch from Actions tab

**Option C:** Automatically on release creation

## Configuration Reference

### Workflow Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `release_tag` | Latest tag | Tag to generate notes for |
| `since_tag` | Previous tag | Include PRs merged after this tag |
| `output_targets` | `github` | Comma-separated: `github,slack,notion` |
| `include_contributors` | `true` | List contributors in release notes |
| `group_by_labels` | `true` | Group PRs by their labels |
| `ai_tone` | `professional` | Claude's writing tone |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Claude API authentication |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |
| `SLACK_WEBHOOK_URL` | Optional. Slack incoming webhook |
| `NOTION_TOKEN` | Optional. Notion API token |
| `NOTION_DATABASE_ID` | Optional. Target database for Notion pages |

## Example

### Input: Merged PRs

```json
[
  {
    "number": 142,
    "title": "Add dark mode support",
    "labels": ["feature", "ui"],
    "author": "sarahdev",
    "body": "Implements system-aware dark mode with manual toggle..."
  },
  {
    "number": 138,
    "title": "Fix memory leak in WebSocket handler",
    "labels": ["bug", "critical"],
    "author": "mikefixer",
    "body": "Resolves OOM issues reported in #134..."
  },
  {
    "number": 145,
    "title": "Upgrade to Node 20 LTS",
    "labels": ["dependencies"],
    "author": "dependabot[bot]",
    "body": "Bumps Node.js from 18.x to 20.x..."
  }
]
```

### Output: Generated Release Notes

```markdown
## v2.4.0

We're excited to announce v2.4.0 with dark mode support, critical stability 
improvements, and an upgrade to Node 20 LTS.

### ✨ Features

- **Dark mode support** — The app now respects your system theme preference 
  with an option to manually toggle between light and dark modes. (#142)

### 🐛 Bug Fixes

- **Fixed memory leak in WebSocket handler** — Resolved an out-of-memory issue 
  affecting long-running connections. Thanks to everyone who reported this 
  in #134. (#138)

### 📦 Dependencies

- Upgraded to Node.js 20 LTS for improved performance and security (#145)

---

**Contributors:** @sarahdev, @mikefixer

**Full Changelog:** v2.3.0...v2.4.0
```

## Advanced Usage

### Custom Prompt Template

Create `.github/release-notes-prompt.md` to customize Claude's instructions:

```markdown
You are a technical writer creating release notes.

Guidelines:
- Be concise but informative
- Highlight user-facing changes first
- Use present tense ("Adds" not "Added")
- Include PR numbers for reference
- Group related changes together
```

### Slack Message Customization

The Slack output includes:
- Release version and link
- Summary of changes by category
- Direct links to PRs
- Contributor mentions

### Notion Integration

Creates a new page in your releases database with:
- Title: Release version
- Properties: Date, Version, Contributors
- Content: Full release notes in Notion blocks

## Development

```bash
# Clone the repo
git clone https://github.com/christiancaviedes/ai-release-notes-generator.git
cd ai-release-notes-generator

# Install dependencies
npm install

# Run locally (requires env vars)
cp .env.example .env
# Edit .env with your keys
npm start
```

### Testing

```bash
# Run tests
npm test

# Test with sample data
npm run test:sample
```

## How Claude Generates Notes

1. **Fetches PRs** — Uses GitHub API to get all merged PRs since the last tag
2. **Groups by labels** — Organizes PRs into categories (features, fixes, etc.)
3. **Sends to Claude** — Provides PR data with structured prompt
4. **Formats output** — Claude returns markdown optimized for readability
5. **Posts results** — Publishes to configured outputs

The prompt instructs Claude to:
- Write for humans, not machines
- Emphasize user impact over implementation details
- Maintain consistent formatting
- Credit contributors appropriately

## Troubleshooting

### "No PRs found since last tag"

Ensure your PRs are merged (not just closed) and that you're comparing against the correct tag.

### "Claude API rate limited"

The action includes exponential backoff retry logic. For high-volume repos, consider upgrading your Anthropic API tier.

### "Slack notification failed"

Verify your webhook URL is correct and the channel still exists. Test with:

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs to the `main` branch.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ by [Christian Caviedes](https://github.com/christiancaviedes)

Powered by [Claude AI](https://www.anthropic.com/claude) from Anthropic
