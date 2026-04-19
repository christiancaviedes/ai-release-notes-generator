import { getMergedPRs, updateRelease, createRelease, getReleaseByTag } from './github.js';
import { generateReleaseNotes } from './claude.js';
import { postToSlack } from './slack.js';
import { createNotionPage } from './notion.js';
import { groupPRsByLabel, formatPRsForPrompt } from './formatters.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';

async function main() {
  const releaseTag = process.env.RELEASE_TAG;
  const sinceTag = process.env.SINCE_TAG;
  const outputTargets = (process.env.OUTPUT_TARGETS || 'github').split(',').map(t => t.trim());
  const aiTone = process.env.AI_TONE || 'professional';
  const repo = process.env.GITHUB_REPOSITORY;

  console.log(`Generating release notes for ${releaseTag}`);
  console.log(`Including PRs since: ${sinceTag || 'beginning'}`);
  console.log(`Output targets: ${outputTargets.join(', ')}`);

  if (process.argv.includes('--sample')) {
    await runWithSampleData();
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required');
  }

  const config = loadConfig();
  const [owner, repoName] = repo.split('/');

  console.log('\nFetching merged PRs...');
  const prs = await getMergedPRs(owner, repoName, sinceTag);

  if (prs.length === 0) {
    console.log('No merged PRs found since last tag');
    const emptyNotes = `## ${releaseTag}\n\nNo changes since ${sinceTag || 'initial release'}.`;
    writeFileSync('release-notes.md', emptyNotes);
    return;
  }

  console.log(`Found ${prs.length} merged PRs`);

  const groupedPRs = groupPRsByLabel(prs, config.labels);
  const formattedPRs = formatPRsForPrompt(groupedPRs);

  console.log('\nGenerating release notes with Claude...');
  const releaseNotes = await generateReleaseNotes({
    version: releaseTag,
    previousVersion: sinceTag,
    prs: formattedPRs,
    tone: aiTone,
    sections: config.sections,
    repoUrl: `https://github.com/${repo}`
  });

  writeFileSync('release-notes.md', releaseNotes);
  console.log('\nRelease notes saved to release-notes.md');

  for (const target of outputTargets) {
    try {
      switch (target.toLowerCase()) {
        case 'github':
          if (process.env.GITHUB_TOKEN) {
            console.log('\nPosting to GitHub Release...');
            const existingRelease = await getReleaseByTag(owner, repoName, releaseTag);
            if (existingRelease) {
              await updateRelease(owner, repoName, existingRelease.id, releaseNotes);
              console.log('GitHub Release updated');
            } else {
              await createRelease(owner, repoName, releaseTag, releaseNotes);
              console.log('GitHub Release created');
            }
          }
          break;

        case 'slack':
          if (process.env.SLACK_WEBHOOK_URL) {
            console.log('\nPosting to Slack...');
            await postToSlack(releaseNotes, releaseTag, `https://github.com/${repo}`);
            console.log('Slack notification sent');
          } else {
            console.log('Skipping Slack: SLACK_WEBHOOK_URL not configured');
          }
          break;

        case 'notion':
          if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
            console.log('\nCreating Notion page...');
            await createNotionPage(releaseNotes, releaseTag, prs);
            console.log('Notion page created');
          } else {
            console.log('Skipping Notion: NOTION_TOKEN or NOTION_DATABASE_ID not configured');
          }
          break;

        default:
          console.log(`Unknown output target: ${target}`);
      }
    } catch (error) {
      console.error(`Failed to post to ${target}:`, error.message);
    }
  }

  console.log('\nRelease notes generation complete!');
}

function loadConfig() {
  const defaultConfig = {
    sections: ['breaking_changes', 'features', 'fixes', 'performance', 'documentation', 'dependencies', 'other'],
    labels: {
      breaking_changes: ['breaking', 'breaking-change', 'major'],
      features: ['feature', 'enhancement', 'feat', 'new'],
      fixes: ['bug', 'fix', 'bugfix', 'patch'],
      performance: ['performance', 'perf', 'optimization'],
      documentation: ['documentation', 'docs', 'doc'],
      dependencies: ['dependencies', 'deps', 'dependency']
    }
  };

  const configPaths = [
    '.github/release-notes-config.yml',
    '.github/release-notes-config.yaml',
    'release-notes-config.yml'
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const userConfig = parseYaml(content);
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn(`Failed to parse config at ${configPath}:`, error.message);
      }
    }
  }

  return defaultConfig;
}

async function runWithSampleData() {
  console.log('Running with sample data...\n');

  const samplePRs = JSON.parse(readFileSync('examples/example-prs.json', 'utf-8'));
  const config = loadConfig();
  const groupedPRs = groupPRsByLabel(samplePRs, config.labels);
  const formattedPRs = formatPRsForPrompt(groupedPRs);

  const releaseNotes = await generateReleaseNotes({
    version: 'v2.4.0',
    previousVersion: 'v2.3.0',
    prs: formattedPRs,
    tone: 'professional',
    sections: config.sections,
    repoUrl: 'https://github.com/example/repo'
  });

  console.log('Generated Release Notes:\n');
  console.log(releaseNotes);
  writeFileSync('release-notes.md', releaseNotes);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
