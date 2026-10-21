/**
 * stripMarkdown
 * Pure utility function to strip markdown formatting characters
 * from listing description text, producing clean plain text for presentation.
 */
export function stripMarkdown(raw: string | undefined | null): string {
  if (!raw) return ''

  return raw
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')
    })
    // Remove images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove heading markers (# Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers: ***text***, **text**, *text*, ___text___, __text__, _text_
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough ~~text~~
    .replace(/~~(.*?)~~/g, '$1')
    // Remove inline code `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquote markers (> text)
    .replace(/^\s*>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^([-*_]){3,}\s*$/gm, '')
    // Normalize excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
