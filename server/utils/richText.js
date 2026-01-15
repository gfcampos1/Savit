const sanitizeHtml = require('sanitize-html');

function isLikelyHtml(text) {
  const s = String(text || '');
  return /<\s*\/?\s*(p|br|strong|em|b|i|u|s|h1|h2|h3|ul|ol|li|blockquote|code|pre|a|div|span|button)\b/i.test(s);
}

function sanitizeRichTextHtml(html) {
  const input = String(html || '');
  if (!input.trim()) return '';

  return sanitizeHtml(input, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
      'h1', 'h2', 'h3',
      'ul', 'ol', 'li',
      'blockquote',
      'code', 'pre',
      'a',
      'div', 'span',
      'button'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      div: ['class', 'data-mindmap'],
      span: ['class'],
      button: ['class', 'type']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    // Only keep mindmap-* classes (defense-in-depth)
    allowedClasses: {
      div: [/^mindmap-/i],
      span: [/^mindmap-/i],
      button: [/^mindmap-/i]
    },
    // Drop any inline styles
    allowedStyles: {},
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
      button: sanitizeHtml.simpleTransform('button', { type: 'button' }, true)
    }
  });
}

function normalizeStoredText(text) {
  const s = String(text || '');
  if (!s.trim()) return '';

  // Only sanitize if it looks like HTML; otherwise keep as plain text
  // to avoid mangling strings that contain '<' as plain content.
  if (isLikelyHtml(s)) {
    return sanitizeRichTextHtml(s).trim();
  }

  return s.trimEnd();
}

module.exports = {
  isLikelyHtml,
  sanitizeRichTextHtml,
  normalizeStoredText
};
