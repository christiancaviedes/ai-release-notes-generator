export function groupPRsByLabel(prs, labelConfig) {
  const grouped = {
    breaking_changes: [],
    features: [],
    fixes: [],
    performance: [],
    documentation: [],
    dependencies: [],
    other: []
  };

  for (const pr of prs) {
    const prLabels = pr.labels.map(l => l.toLowerCase());
    let categorized = false;

    for (const [category, labels] of Object.entries(labelConfig)) {
      const normalizedLabels = labels.map(l => l.toLowerCase());
      if (prLabels.some(l => normalizedLabels.includes(l))) {
        if (grouped[category]) {
          grouped[category].push(pr);
          categorized = true;
          break;
        }
      }
    }

    if (!categorized) {
      grouped.other.push(pr);
    }
  }

  return grouped;
}

export function formatPRsForPrompt(groupedPRs) {
  const sections = [];

  const sectionConfig = {
    breaking_changes: '### 💥 Breaking Changes',
    features: '### ✨ Features',
    fixes: '### 🐛 Bug Fixes',
    performance: '### ⚡ Performance',
    documentation: '### 📚 Documentation',
    dependencies: '### 📦 Dependencies',
    other: '### 🔧 Other Changes'
  };

  for (const [category, prs] of Object.entries(groupedPRs)) {
    if (prs.length === 0) continue;

    const header = sectionConfig[category] || `### ${category}`;
    const items = prs.map(pr => formatPRItem(pr)).join('\n');
    sections.push(`${header}\n${items}`);
  }

  return sections.join('\n\n');
}

function formatPRItem(pr) {
  const title = pr.title.trim();
  const body = pr.body ? summarizeBody(pr.body) : '';
  const author = pr.author;
  const number = pr.number;

  let item = `- **${title}** (#${number}) by @${author}`;

  if (body) {
    item += `\n  ${body}`;
  }

  return item;
}

function summarizeBody(body) {
  if (!body) return '';

  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = cleaned.split('\n');
  const meaningfulLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.toLowerCase().includes('checklist')) continue;
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) continue;
    if (trimmed.match(/^(fixes|closes|resolves)\s*#\d+/i)) continue;
    if (trimmed.startsWith('Co-authored-by:')) continue;
    if (trimmed.startsWith('Signed-off-by:')) continue;

    meaningfulLines.push(trimmed);

    if (meaningfulLines.length >= 2) break;
  }

  const summary = meaningfulLines.join(' ').slice(0, 200);
  return summary.length === 200 ? summary + '...' : summary;
}

export function extractContributors(prs) {
  const contributors = new Set();

  for (const pr of prs) {
    if (pr.author && !pr.author.includes('[bot]')) {
      contributors.add(`@${pr.author}`);
    }
  }

  return Array.from(contributors).sort();
}

export function formatContributorsList(contributors) {
  if (contributors.length === 0) return '';
  if (contributors.length === 1) return contributors[0];
  if (contributors.length === 2) return `${contributors[0]} and ${contributors[1]}`;

  const last = contributors.pop();
  return `${contributors.join(', ')}, and ${last}`;
}
