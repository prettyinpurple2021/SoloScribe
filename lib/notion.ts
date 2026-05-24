import { toast } from 'sonner';

export interface NotionBlock {
  object: "block";
  type: string;
  [key: string]: any;
}

// Inline style parser to enrich native text styling inside Notion blocks
function parseInlineStyles(text: string): any[] {
  if (!text) return [];

  const parts: any[] = [];
  // Match bold (**bold**), italic (*italic*), code (`code`), or plain text
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|[^\*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const token = match[1];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push({
        type: 'text',
        text: { content: token.slice(2, -2) },
        annotations: { bold: true }
      });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push({
        type: 'text',
        text: { content: token.slice(1, -1) },
        annotations: { italic: true }
      });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({
        type: 'text',
        text: { content: token.slice(1, -1) },
        annotations: { code: true }
      });
    } else {
      parts.push({
        type: 'text',
        text: { content: token }
      });
    }
  }

  if (parts.length === 0) {
    parts.push({
      type: 'text',
      text: { content: text }
    });
  }

  return parts;
}

// Markdown string to Notion Content Blocks conversion
export function markdownToNotionBlocks(md: string): NotionBlock[] {
  const lines = md.split(/\r?\n/);
  const blocks: NotionBlock[] = [];
  
  const bracketRegex = /^(?:>\s*)?\[(!)?(inklo|alert|warning|caution|critical|danger|error|important|tip|success|info|note|founder(?:\s+)alert)\]\s*(.*)$/i;
  const customRegex = /^(?:>\s*)?(inklo|alert|warning|caution|critical|danger|error|important|tip|success|info|note|founder(?:\s+)alert):\s*(.*)$/i;

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = 'plain text';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code Block parsing
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close current code block
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            language: codeLanguage,
            rich_text: [
              {
                type: 'text',
                text: { content: codeBuffer.join('\n') }
              }
            ]
          }
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        // Open new code block
        inCodeBlock = true;
        const langMatch = line.trim().match(/^```(\w+)/);
        codeLanguage = langMatch ? langMatch[1] : 'plain text';
        // Support common language mappings
        if (codeLanguage === 'js') codeLanguage = 'javascript';
        if (codeLanguage === 'ts') codeLanguage = 'typescript';
        if (codeLanguage === 'py') codeLanguage = 'python';
        if (codeLanguage === 'sh') codeLanguage = 'shell';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Skip consecutive empty lines
    if (!line.trim()) {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'paragraph') {
        // Single empty paragraph is good for spacing
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [] }
        });
      }
      continue;
    }

    // Callout Block: GFM or Custom brackets (e.g. [!NOTE], [INKLO])
    const bracketMatch = line.trim().match(bracketRegex);
    // Callout Block: Custom Inklo/Founder Alert (e.g. > ALERT: text)
    const customMatch = line.trim().match(customRegex);

    if (bracketMatch || customMatch) {
      const rawType = (bracketMatch ? bracketMatch[2] : customMatch![1]);
      const typeStr = rawType.toLowerCase().replace(/\s+/g, ' ');
      let firstLineContent = (bracketMatch ? bracketMatch[3] : customMatch![2]).trim();

      let emoji = '💡';
      let color = 'default';

      switch (typeStr) {
        case 'inklo':
          emoji = '⚡';
          color = 'purple_background';
          break;
        case 'warning':
        case 'caution':
          emoji = '⚠️';
          color = 'yellow_background';
          break;
        case 'critical':
        case 'danger':
        case 'error':
        case 'alert':
        case 'founder alert':
          emoji = '🚨';
          color = 'red_background';
          break;
        case 'important':
          emoji = '📌';
          color = 'orange_background';
          break;
        case 'tip':
        case 'success':
          emoji = '✨';
          color = 'green_background';
          break;
        case 'info':
        case 'note':
        default:
          emoji = '💡';
          color = 'gray_background';
          break;
      }

      const calloutLines: string[] = [];
      if (firstLineContent) {
        calloutLines.push(firstLineContent);
      } else {
        calloutLines.push(`**${typeStr.toUpperCase()}**`);
      }

      // Peek next lines to see if they are a continuation of the callout
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (
          nextLine.startsWith('>') && 
          !bracketRegex.test(nextLine) && 
          !customRegex.test(nextLine)
        ) {
          const content = nextLine.replace(/^>\s*/, '').trim();
          calloutLines.push(content);
          i++;
        } else {
          break;
        }
      }

      const fullCalloutText = calloutLines.join('\n');
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: parseInlineStyles(fullCalloutText),
          icon: {
            type: 'emoji',
            emoji: emoji
          },
          color: color
        }
      });
      continue;
    }

    // Task List Items (to_do)
    const todoMatch = line.trim().match(/^([-*]\s+|\d+\.\s+)?\[([ xX!])\]\s+(.*)/);
    if (todoMatch) {
      const checked = todoMatch[2].toLowerCase() === 'x';
      const taskText = todoMatch[3].trim();
      const isPriority = todoMatch[2] === '!' || 
        /\b(?:priority|urgent|critical|important)\b/i.test(taskText) ||
        /⚠️|🚨|🔥/g.test(taskText);

      const richText = parseInlineStyles(taskText);
      if (isPriority) {
        richText.forEach(part => {
          if (!part.annotations) part.annotations = {};
          part.annotations.bold = true;
          part.annotations.color = 'red';
        });
      }

      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: richText,
          checked: checked
        }
      });
      continue;
    }

    // Heading 1
    const h1Match = line.match(/^#\s+(.*)/);
    if (h1Match) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: parseInlineStyles(h1Match[1].trim())
        }
      });
      continue;
    }

    // Heading 2
    const h2Match = line.match(/^##\s+(.*)/);
    if (h2Match) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: parseInlineStyles(h2Match[1].trim())
        }
      });
      continue;
    }

    // Heading 3
    const h3Match = line.match(/^###\s+(.*)/);
    if (h3Match) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: parseInlineStyles(h3Match[1].trim())
        }
      });
      continue;
    }

    // Quote block
    const quoteMatch = line.match(/^>\s+(.*)/);
    if (quoteMatch) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: parseInlineStyles(quoteMatch[1].trim())
        }
      });
      continue;
    }

    // Bullet list item
    const bulletMatch = line.match(/^[*-]\s+(.*)/);
    if (bulletMatch) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseInlineStyles(bulletMatch[1].trim())
        }
      });
      continue;
    }

    // Numbered list item
    const numberMatch = line.match(/^\d+\.\s+(.*)/);
    if (numberMatch) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseInlineStyles(numberMatch[1].trim())
        }
      });
      continue;
    }

    // Normal paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseInlineStyles(line.trim())
      }
    });
  }

  // Handle unclosed code blocks gracefully
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      object: 'block',
      type: 'code',
      code: {
        language: codeLanguage,
        rich_text: [
          {
            type: 'text',
            text: { content: codeBuffer.join('\n') }
          }
        ]
      }
    });
  }

  // Max block limit safety constraint in single Notion API request
  return blocks.slice(0, 100);
}

// Real Export API Call using secure pass-through CORS proxy
export async function sendToNotion(params: {
  token: string;
  parentId: string;
  parentType: 'page' | 'database';
  title: string;
  content: string;
}): Promise<{ url: string; id: string }> {
  const { token, parentId, parentType, title, content } = params;

  if (!token) throw new Error('NOTION_CREDENTIALS_MISSING: Integration Token is empty.');
  if (!parentId) throw new Error('NOTION_CREDENTIALS_MISSING: Parent Target ID is empty.');

  // Clean of characters to parse alphanumeric properly
  const cleanParentId = parentId.replace(/-/g, '').trim();

  // Pre-compile blocks
  const childrenBlocks = markdownToNotionBlocks(content);

  // Construct target page request body
  const body: any = {
    children: childrenBlocks
  };

  if (parentType === 'database') {
    body.parent = { database_id: cleanParentId };
    body.properties = {
      // "Name" is the standard default Title attribute for database entries in Notion
      Name: {
        title: [
          {
            type: 'text',
            text: { content: title }
          }
        ]
      }
    };
  } else {
    body.parent = { page_id: cleanParentId };
    body.properties = {
      title: {
        title: [
          {
            type: 'text',
            text: { content: title }
          }
        ]
      }
    };
  }

  // Notion API URL
  const notionApiUrl = 'https://api.notion.com/v1/pages';
  
  // CORS-Proxy prefix (transparent pass-through proxy)
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(notionApiUrl);

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      // Fail gracefully
    }
    const errMsg = parsedErr?.message || `HTTP_ERROR: ${response.status}`;
    throw new Error(`NOTION_API_REJECTED: ${errMsg}`);
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error('NOTION_API_REJECTED: Response did not contain page url.');
  }

  return {
    url: data.url,
    id: data.id
  };
}

// Connection check to verify if token and parent ID are correct
export async function testNotionConnection(token: string, parentId: string, parentType: 'page' | 'database'): Promise<string> {
  if (!token) throw new Error('Integration token is required.');
  if (!parentId) throw new Error('Parent ID is required.');

  const cleanParentId = parentId.replace(/-/g, '').trim();
  const endpoint = parentType === 'database' 
    ? `https://api.notion.com/v1/databases/${cleanParentId}` 
    : `https://api.notion.com/v1/pages/${cleanParentId}`;

  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(endpoint);

  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      // Fail gracefully
    }
    const errMsg = parsedErr?.message || `HTTP_ERROR_CODE: ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  // Get titles parsed beautifully depending on the Page or Database response structure
  let title = 'Untitled Target';
  if (parentType === 'database') {
    title = data.title?.[0]?.plain_text || 'Database Target';
  } else {
    // If it's a page, the title lives in properties.title
    title = data.properties?.title?.title?.[0]?.plain_text || 'Page Target';
  }

  return title;
}
