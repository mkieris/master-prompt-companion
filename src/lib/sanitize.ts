import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to strip dangerous content while preserving safe HTML.
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u',
      'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'img'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'class', 'id',
      'src', 'alt', 'width', 'height',
      'colspan', 'rowspan'
    ],
    // Force all links to open in new tab with noopener
    ADD_ATTR: ['target', 'rel'],
    // Transform hooks for additional safety
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
};

/**
 * Escape HTML entities for safe text display.
 * Use when you need to display raw text that might contain HTML characters.
 */
export const escapeHtml = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Converts Markdown tables to HTML tables with sanitized cell content.
 * Safe for use with dangerouslySetInnerHTML when combined with sanitizeHtml.
 */
export const convertMarkdownTablesToHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  const lines = text.split('\n');
  let result: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const isTableRow = line.startsWith('|') && line.endsWith('|');
    const isSeparatorRow = /^\|[-:\s|]+\|$/.test(line);
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable && tableLines.length > 0) {
        result.push(convertTableToHtml(tableLines));
        tableLines = [];
        inTable = false;
      }
      result.push(lines[i]);
    }
  }
  
  if (inTable && tableLines.length > 0) {
    result.push(convertTableToHtml(tableLines));
  }
  
  return result.join('\n');
};

/**
 * Internal function to convert table lines to HTML.
 * Escapes cell content to prevent XSS.
 */
const convertTableToHtml = (tableLines: string[]): string => {
  if (tableLines.length < 2) return tableLines.join('\n');
  
  let html = '<table class="w-full border-collapse my-4 text-sm">';
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    
    // Skip separator rows
    if (/^\|[-:\s|]+\|$/.test(line)) continue;
    
    const cells = line
      .split('|')
      .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map(cell => cell.trim());
    
    if (i === 0) {
      // Header row
      html += '<thead class="bg-muted"><tr>';
      cells.forEach(cell => {
        html += `<th class="border border-border p-2 text-left font-medium">${escapeHtml(cell)}</th>`;
      });
      html += '</tr></thead><tbody>';
    } else {
      // Data row
      html += '<tr class="border-b border-border hover:bg-muted/50">';
      cells.forEach(cell => {
        html += `<td class="border border-border p-2">${escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    }
  }
  
  html += '</tbody></table>';
  return html;
};
