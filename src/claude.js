import Anthropic from '@anthropic-ai/sdk';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const client = new Anthropic();

export async function generateReleaseNotes({ version, previousVersion, prs, tone, sections, repoUrl }) {
  const prompt = buildPrompt({ version, previousVersion, prs, tone, sections, repoUrl });

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text.trim();
    } catch (error) {
      lastError = error;

      if (error.status === 429 || error.status >= 500) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} retries: ${lastError.message}`);
}

function buildPrompt({ version, previousVersion, prs, tone, sections, repoUrl }) {
  const toneInstructions = {
    professional: 'Write in a professional, clear tone suitable for enterprise users. Be concise but thorough.',
    casual: 'Write in a friendly, conversational tone. Use simple language and feel free to add personality.',
    technical: 'Write in a technical tone with precise terminology. Include relevant technical details for developers.'
  };

  const sectionEmojis = {
    breaking_changes: '💥 Breaking Changes',
    features: '✨ Features',
    fixes: '🐛 Bug Fixes',
    performance: '⚡ Performance',
    documentation: '📚 Documentation',
    dependencies: '📦 Dependencies',
    other: '🔧 Other Changes'
  };

  const sectionsToInclude = sections
    .filter(s => prs.includes(`### ${sectionEmojis[s] || s}`))
    .map(s => sectionEmojis[s] || s)
    .join(', ');

  return `You are a technical writer creating release notes for a software project.

## Task
Generate polished, human-readable release notes for version ${version} based on the merged pull requests provided below.

## Guidelines
- ${toneInstructions[tone] || toneInstructions.professional}
- Write for humans, not machines. Focus on user impact over implementation details.
- Start with a brief 1-2 sentence summary of this release's highlights.
- Group changes into appropriate sections using these headers with emojis:
  ${Object.entries(sectionEmojis).map(([k, v]) => `- ${v}`).join('\n  ')}
- Only include sections that have changes. Skip empty sections.
- For each change:
  - Write a clear, concise description (1-2 sentences max)
  - Bold the main feature/fix name
  - Include the PR number in parentheses at the end
- If there are breaking changes, put them first and be clear about migration steps.
- End with a Contributors section listing unique authors (format: @username)
- Include a "Full Changelog" link: ${repoUrl}/compare/${previousVersion || 'initial'}...${version}

## Pull Requests to Summarize

${prs}

## Output Format
Return only the release notes in Markdown format. Start with "## ${version}" as the header.
Do not include any preamble or explanation outside the release notes themselves.`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
