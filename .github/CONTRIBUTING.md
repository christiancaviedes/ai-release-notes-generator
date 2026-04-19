# Contributing to AI Release Notes Generator

Thanks for wanting to improve this action. Contributions make it better for everyone shipping software.

## What We'd Love

- **New output integrations** — Linear, Confluence, email, custom webhooks
- **Label taxonomy improvements** — better default label groupings
- **Prompt refinements** — edge cases like monorepos, non-semantic PR titles
- **Bug reports** — especially around pagination (repos with 100+ PRs between releases)
- **Real-world examples** — PRs showing before/after output quality

## How to Contribute

1. **Fork** the repo and create a branch: `git checkout -b feature/your-feature-name`
2. **Make your changes** — keep PRs tightly scoped
3. **Add tests**: `npm test`
4. **Test against a real repo** if you can — or describe your test scenario in the PR
5. **Open a PR** with what you changed and a sample of the output improvement

## Development Setup

```bash
git clone https://github.com/christiancaviedes/ai-release-notes-generator.git
cd ai-release-notes-generator
npm install
cp .env.example .env
# Add ANTHROPIC_API_KEY and GITHUB_TOKEN to .env
npm test
```

## Reporting Issues

Open an issue with:
- Your workflow file (secrets redacted)
- The repo setup (labels used, tag format)
- What you expected vs. what you got
- Any GitHub Actions logs

## Code Style

- Run `npm run lint` before submitting
- Keep workflow YAML readable — comments are welcome
- No new external dependencies without opening an issue first

## Questions

Open an issue with the `question` label.
