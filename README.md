# AI Release Notes Generator

[![npm version](https://img.shields.io/npm/v/ai-release-notes-generator.svg)](https://www.npmjs.com/package/ai-release-notes-generator)
[![GitHub Action](https://img.shields.io/badge/GitHub-Action-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange)](https://www.anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/christiancaviedes/ai-release-notes-generator/pulls)

## Ship faster. Write better release notes. Automatically.

Writing release notes is a tax on every engineer who touches the codebase. It's manual, inconsistent, and usually forgotten until someone is staring at a tag push with nothing written. This GitHub Action reads your merged PRs, groups them by label, and uses Claude AI to produce polished, human-readable release notes — posted to GitHub Releases, Slack, or Notion.

One YAML file. Done forever.

---

## Features

- **PR-native** — reads merged PRs automatically, no extra tagging needed
- **AI-written prose** — Claude summarizes for humans, not machines
- **Label-aware grouping** — features, fixes, breaking changes, deps auto-organized
- **Multi-destination output** — GitHub Releases, Slack, and Notion simultaneously
- **Configurable tone** — professional, casual, or technical
- **Contributor credits** — automatically lists everyone who shipped
- **Custom prompt support** — override the AI instructions entirely
- **Zero setup** — works with a single workflow file and one secret

---

## Quick Start

### 1. Add the workflow file

```yaml
# .github/workflows/release-notes.yml
name: Release Notes
on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  release-notes:
    uses: christiancaviedes/ai-release-notes-generator/.github/workflows/release-notes.yml@main
    with:
      output_targets: 'github,slack'
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. Add secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | From [console.anthropic.com](https://console.anthropic.com) |
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook |
| `NOTION_TOKEN` | No | Notion integration token |
| `NOTION_DATABASE_ID` | No | Target Notion database ID |

### 3. Push a tag

```bash
git tag v1.3.0
git push origin v1.3.0
# Release notes generate and publish automatically
```

---

## Demo

**Input — Merged PRs:**

```
PR #142  Add dark mode support         [feature, ui]    @sarahdev
PR #138  Fix memory leak in WebSocket  [bug, critical]  @mikefixer
PR #145  Upgrade to Node 20 LTS        [dependencies]   @dependabot
```

**Output — Generated Release Notes:**

```markdown
## v2.4.0

Dark mode, a critical stability fix, and a Node 20 upgrade.

### Features
- **Dark mode** — The app now respects your system theme with a manual toggle
  for when you want to override it. (#142)

### Bug Fixes
- **Fixed WebSocket memory leak** — Resolved an out-of-memory issue affecting
  long-running connections reported in #134. (#138)

### Dependencies
- Upgraded to Node.js 20 LTS for improved performance and long-term support (#145)

---
Contributors: @sarahdev, @mikefixer
Full Changelog: v2.3.0...v2.4.0
```

---

## Configuration

Create `.github/release-notes-config.yml` in your repo to customize:

```yaml
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

### Workflow Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `release_tag` | Latest tag | Tag to generate notes for |
| `since_tag` | Previous tag | Include PRs merged after this tag |
| `output_targets` | `github` | Comma-separated: `github,slack,notion` |
| `include_contributors` | `true` | List contributors |
| `group_by_labels` | `true` | Group PRs by label |
| `ai_tone` | `professional` | Writing tone for Claude |

---

## How It Works

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Merged PRs  │────▶│  GitHub Action  │────▶│  Claude AI  │
│ since v1.2.0 │     │ (label grouping)│     │ (prose gen) │
└──────────────┘     └─────────────────┘     └─────────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              ▼                      ▼                      ▼
                       GitHub Releases          Slack Channel         Notion DB
```

1. Fetches all PRs merged since the previous tag via GitHub API
2. Groups them by label into sections (features, fixes, etc.)
3. Sends structured PR data to Claude with tone and format instructions
4. Posts the formatted output to all configured destinations

---

## Advanced Usage

### Custom Prompt Template

Create `.github/release-notes-prompt.md` to fully customize Claude's instructions:

```markdown
You are a technical writer creating release notes for a developer audience.
Be concise. Use present tense. Highlight user impact. Include PR numbers.
```

### Notion Integration

Creates a new Notion page per release with:
- Title: Release version + date
- Properties: Version, Date, Contributors
- Full release notes as Notion blocks

---

## Troubleshooting

**"No PRs found since last tag"** — Ensure PRs are merged (not just closed) and you're comparing against the right tag.

**"Claude API rate limited"** — The action includes exponential backoff. For high-volume repos, consider upgrading your Anthropic API tier.

**"Slack notification failed"** — Test your webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"test"}' YOUR_WEBHOOK_URL`

---

## Development

```bash
git clone https://github.com/christiancaviedes/ai-release-notes-generator.git
cd ai-release-notes-generator
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY and GITHUB_TOKEN to .env
npm test
```

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md). Bug reports, new output integrations, and prompt improvements are especially welcome.

---

## License

MIT © 2026 [Christian Caviedes](https://github.com/christiancaviedes)

Powered by [Claude AI](https://www.anthropic.com/claude) from Anthropic
