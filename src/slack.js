import axios from 'axios';

export async function postToSlack(releaseNotes, version, repoUrl) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL is not configured');
  }

  const blocks = buildSlackBlocks(releaseNotes, version, repoUrl);

  const response = await axios.post(webhookUrl, {
    blocks,
    text: `New release: ${version}` // Fallback for notifications
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.status !== 200) {
    throw new Error(`Slack API returned ${response.status}`);
  }
}

function buildSlackBlocks(releaseNotes, version, repoUrl) {
  const sections = parseReleaseNotesForSlack(releaseNotes);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🚀 New Release: ${version}`,
        emoji: true
      }
    },
    {
      type: 'divider'
    }
  ];

  if (sections.summary) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: sections.summary
      }
    });
  }

  const changeTypes = ['breaking_changes', 'features', 'fixes', 'performance', 'dependencies', 'other'];

  for (const changeType of changeTypes) {
    if (sections[changeType] && sections[changeType].length > 0) {
      const emoji = getEmojiForType(changeType);
      const title = formatTypeTitle(changeType);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${emoji} ${title}*\n${sections[changeType].slice(0, 5).map(c => `• ${c}`).join('\n')}`
        }
      });

      if (sections[changeType].length > 5) {
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `_+${sections[changeType].length - 5} more changes..._`
          }]
        });
      }
    }
  }

  if (sections.contributors && sections.contributors.length > 0) {
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `👥 *Contributors:* ${sections.contributors.join(', ')}`
      }]
    });
  }

  blocks.push({
    type: 'divider'
  });

  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: '📋 View Full Release Notes',
        emoji: true
      },
      url: `${repoUrl}/releases/tag/${version}`,
      action_id: 'view_release'
    }]
  });

  return blocks;
}

function parseReleaseNotesForSlack(markdown) {
  const sections = {
    summary: '',
    breaking_changes: [],
    features: [],
    fixes: [],
    performance: [],
    documentation: [],
    dependencies: [],
    other: [],
    contributors: []
  };

  const lines = markdown.split('\n');
  let currentSection = 'summary';
  let summaryLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) continue;

    if (trimmed.startsWith('### ')) {
      const header = trimmed.toLowerCase();
      if (header.includes('breaking')) currentSection = 'breaking_changes';
      else if (header.includes('feature')) currentSection = 'features';
      else if (header.includes('fix') || header.includes('bug')) currentSection = 'fixes';
      else if (header.includes('performance')) currentSection = 'performance';
      else if (header.includes('doc')) currentSection = 'documentation';
      else if (header.includes('dependenc')) currentSection = 'dependencies';
      else if (header.includes('contributor')) currentSection = 'contributors';
      else currentSection = 'other';
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).trim();

      if (currentSection === 'contributors') {
        const mentions = content.match(/@[\w-]+/g) || [];
        sections.contributors.push(...mentions);
      } else if (Array.isArray(sections[currentSection])) {
        const slackFormatted = content
          .replace(/\*\*([^*]+)\*\*/g, '*$1*')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        sections[currentSection].push(slackFormatted);
      }
    } else if (currentSection === 'summary' && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('**')) {
      summaryLines.push(trimmed);
    }
  }

  sections.summary = summaryLines.slice(0, 3).join(' ').slice(0, 500);
  sections.contributors = [...new Set(sections.contributors)];

  return sections;
}

function getEmojiForType(type) {
  const emojis = {
    breaking_changes: '💥',
    features: '✨',
    fixes: '🐛',
    performance: '⚡',
    documentation: '📚',
    dependencies: '📦',
    other: '🔧'
  };
  return emojis[type] || '📝';
}

function formatTypeTitle(type) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
