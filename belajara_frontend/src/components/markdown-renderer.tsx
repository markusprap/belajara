import * as React from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null

  // A robust block-based Markdown parser
  const lines = content.split(/\r?\n/)
  const elements: React.ReactNode[] = []
  
  let i = 0
  const total = lines.length

  // Helper to parse inline markdown (bold, italic, links, inline code)
  const parseInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = []
    let currentText = text
    let keyIdx = 0

    while (currentText) {
      // 1. Inline code: `code`
      const codeMatch = currentText.match(/^([^`]*?)`([^`]+?)`([\s\S]*)$/)
      // 2. Bold: **text**
      const boldMatch = currentText.match(/^([^\*]*?)\*\*([^\*]+?)\*\*([\s\S]*)$/)
      // 3. Italic: *text*
      const italicMatch = currentText.match(/^([^\*]*?)\*([^\*]+?)\*([\s\S]*)$/)
      // 4. Link: [text](url)
      const linkMatch = currentText.match(/^([^\[]*?)\[([^\]]+?)\]\(([^)]+?)\)([\s\S]*)$/)

      // Find which match occurs first in the string
      let firstMatch: "code" | "bold" | "italic" | "link" | null = null
      let firstIndex = Infinity

      if (codeMatch && codeMatch[1].length < firstIndex) {
        firstMatch = "code"
        firstIndex = codeMatch[1].length
      }
      if (boldMatch && boldMatch[1].length < firstIndex) {
        firstMatch = "bold"
        firstIndex = boldMatch[1].length
      }
      if (italicMatch && italicMatch[1].length < firstIndex) {
        firstMatch = "italic"
        firstIndex = italicMatch[1].length
      }
      if (linkMatch && linkMatch[1].length < firstIndex) {
        firstMatch = "link"
        firstIndex = linkMatch[1].length
      }

      if (firstMatch === "code" && codeMatch) {
        if (codeMatch[1]) tokens.push(codeMatch[1])
        tokens.push(
          <code key={`code-${keyIdx++}`} className="font-mono text-[11px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[#CF3A1F] font-semibold">
            {codeMatch[2]}
          </code>
        )
        currentText = codeMatch[3]
      } else if (firstMatch === "bold" && boldMatch) {
        if (boldMatch[1]) tokens.push(boldMatch[1])
        tokens.push(<strong key={`bold-${keyIdx++}`} className="font-bold text-[#060708]">{boldMatch[2]}</strong>)
        currentText = boldMatch[3]
      } else if (firstMatch === "italic" && italicMatch) {
        if (italicMatch[1]) tokens.push(italicMatch[1])
        tokens.push(<em key={`italic-${keyIdx++}`} className="italic text-slate-700">{italicMatch[2]}</em>)
        currentText = italicMatch[3]
      } else if (firstMatch === "link" && linkMatch) {
        if (linkMatch[1]) tokens.push(linkMatch[1])
        tokens.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#CF3A1F] hover:underline font-semibold"
          >
            {linkMatch[2]}
          </a>
        )
        currentText = linkMatch[4]
      } else {
        tokens.push(currentText)
        break
      }
    }
    return tokens
  }

  // State for copying code block success states
  const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = React.useState(false)
    const handleCopy = () => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    return (
      <button
        onClick={handleCopy}
        type="button"
        className="absolute top-2 right-2 px-2 py-1 rounded bg-[#C6B5BF]/25 hover:bg-[#C6B5BF]/40 text-slate-300 hover:text-white text-[10px] font-sans transition-colors cursor-pointer z-10"
      >
        {copied ? "Tersalin!" : "Salin"}
      </button>
    )
  }

  while (i < total) {
    const line = lines[i]

    // 1. Code blocks
    if (line.trim().startsWith("```")) {
      const lang = line.trim().replace(/^```/, "").trim() || "code"
      let codeText = ""
      i++
      while (i < total && !lines[i].trim().startsWith("```")) {
        codeText += lines[i] + "\n"
        i++
      }
      codeText = codeText.replace(/\n$/, "")
      elements.push(
        <div key={`codeblock-${i}`} className="relative my-4 rounded-lg overflow-hidden border border-slate-800 bg-[#060708] shadow-md group">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#151719] border-b border-slate-800 text-[10px] font-mono text-slate-400">
            <span>{lang.toUpperCase()}</span>
            <CopyButton text={codeText} />
          </div>
          <pre className="p-4 overflow-x-auto text-[12px] font-mono text-emerald-400 leading-relaxed max-h-[350px]">
            <code>{codeText}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    // 2. Blockquotes
    if (line.trim().startsWith(">")) {
      let quoteText = ""
      while (i < total && lines[i].trim().startsWith(">")) {
        quoteText += lines[i].trim().substring(1).trim() + " "
        i++
      }
      elements.push(
        <blockquote key={`blockquote-${i}`} className="border-l-4 border-[#C6B5BF] bg-[#FAF9FB] px-4 py-3 rounded-r-lg italic text-slate-600 my-4 text-xs font-serif leading-relaxed">
          {parseInline(quoteText.trim())}
        </blockquote>
      )
      continue
    }

    // 3. Tables
    if (line.trim().startsWith("|")) {
      const tableRows: string[][] = []
      let headers: string[] = []
      let isDividerParsed = false

      while (i < total && lines[i].trim().startsWith("|")) {
        const rowContent = lines[i]
          .split("|")
          .map(cell => cell.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)

        const isDivider = rowContent.every(cell => cell.match(/^:?-+:?$/))
        if (isDivider) {
          isDividerParsed = true
        } else if (!isDividerParsed && headers.length === 0) {
          headers = rowContent
        } else {
          tableRows.push(rowContent)
        }
        i++
      }

      if (headers.length > 0) {
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-lg border border-border">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-[#FAF9FB] border-b border-border">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-3 font-semibold text-[#060708]">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border hover:bg-slate-50/50">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-3 text-slate-600">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // 4. Headings
    if (line.trim().startsWith("#")) {
      const match = line.match(/^(#{1,6})\s+(.*)$/)
      if (match) {
        const level = match[1].length
        const headingText = match[2]
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${i}`} className="font-heading text-xl font-bold border-b pb-1.5 mb-3 mt-5 text-[#060708]">
              {parseInline(headingText)}
            </h1>
          )
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${i}`} className="font-heading text-lg font-bold mb-2.5 mt-4 text-[#060708]">
              {parseInline(headingText)}
            </h2>
          )
        } else {
          elements.push(
            <h3 key={`h3-${i}`} className="font-heading text-base font-bold mb-2 mt-3 text-[#060708]">
              {parseInline(headingText)}
            </h3>
          )
        }
        i++
        continue
      }
    }

    // 5. Unordered List
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listItems: string[] = []
      while (i < total && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        const itemLine = lines[i].trim()
        listItems.push(itemLine.substring(2).trim())
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 text-slate-700 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 6. Ordered List
    if (line.trim().match(/^\d+\.\s+/)) {
      const listItems: string[] = []
      while (i < total && lines[i].trim().match(/^\d+\.\s+/)) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "").trim()
        listItems.push(itemText)
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-3 text-slate-700 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // 7. Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-t border-[#C6B5BF]/30" />)
      i++
      continue
    }

    // 8. Paragraph
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="text-slate-700 leading-loose mb-3.5">
          {parseInline(line)}
        </p>
      )
    }
    i++
  }

  return <div className="font-sans leading-relaxed text-[13px]">{elements}</div>
}
