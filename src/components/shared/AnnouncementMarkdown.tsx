import ReactMarkdown from 'react-markdown'

const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br']

/**
 * Announcement body: markdown limited to paragraphs, bold, italic, lists and links. Raw HTML is never
 * rendered, other elements (headings, images, code) are unwrapped to their text, and links open in a new
 * tab. `react-markdown` drops unsafe URL schemes such as `javascript:`.
 */
export function AnnouncementMarkdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`announcement-markdown ${className}`}>
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        skipHtml
        components={{
          p: ({ children: content }) => <p className="[&:not(:first-child)]:mt-2">{content}</p>,
          ul: ({ children: content }) => <ul className="mt-2 list-disc pl-5 text-left">{content}</ul>,
          ol: ({ children: content }) => <ol className="mt-2 list-decimal pl-5 text-left">{content}</ol>,
          a: ({ href, children: content }) => (
            <a className="link link-primary" href={href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
