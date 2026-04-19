import axios from 'axios';

const NOTION_API_VERSION = '2022-06-28';

export async function createNotionPage(releaseNotes, version, prs) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    throw new Error('NOTION_TOKEN and NOTION_DATABASE_ID are required');
  }

  const contributors = [...new Set(prs.map(pr => pr.author))];
  const blocks = markdownToNotionBlocks(releaseNotes);

  const response = await axios.post(
    'https://api.notion.com/v1/pages',
    {
      parent: {
        database_id: databaseId
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Release ${version}`
              }
            }
          ]
        },
        Version: {
          rich_text: [
            {
              text: {
                content: version
              }
            }
          ]
        },
        Date: {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        },
        Contributors: {
          rich_text: [
            {
              text: {
                content: contributors.join(', ')
              }
            }
          ]
        },
        'PR Count': {
          number: prs.length
        }
      },
      children: blocks
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_API_VERSION
      }
    }
  );

  if (response.status !== 200) {
    throw new Error(`Notion API returned ${response.status}`);
  }

  return response.data;
}

function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let inList = false;
  let listItems = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList && listItems.length > 0) {
        blocks.push(...listItems);
        listItems = [];
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(3) } }]
        }
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: trimmed.slice(4) } }]
        }
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const content = trimmed.slice(2);
      listItems.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseInlineFormatting(content)
        }
      });
    } else if (trimmed.startsWith('---')) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    } else if (trimmed.startsWith('**Full Changelog:**') || trimmed.startsWith('Full Changelog:')) {
      const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Full Changelog: ' } },
              {
                type: 'text',
                text: {
                  content: linkMatch[1],
                  link: { url: linkMatch[2] }
                }
              }
            ]
          }
        });
      }
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: parseInlineFormatting(trimmed)
        }
      });
    }
  }

  if (listItems.length > 0) {
    blocks.push(...listItems);
  }

  return blocks.slice(0, 100);
}

function parseInlineFormatting(text) {
  const richText = [];
  let remaining = text;

  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, annotation: { bold: true } },
    { regex: /\*([^*]+)\*/g, annotation: { italic: true } },
    { regex: /`([^`]+)`/g, annotation: { code: true } }
  ];

  const parts = [];
  let lastIndex = 0;

  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ content: text.slice(lastIndex, match.index), bold: false });
    }
    parts.push({ content: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ content: text.slice(lastIndex), bold: false });
  }

  if (parts.length === 0) {
    return [{ type: 'text', text: { content: text } }];
  }

  return parts.map(part => ({
    type: 'text',
    text: { content: part.content },
    annotations: part.bold ? { bold: true } : undefined
  }));
}
