// Generates llms.txt and llms-full.txt for the current documentation version,
// following the https://llmstxt.org convention. Run AFTER `hugo` (it reads the
// populated content/ tree and writes into the built public/ directory).
//
// - llms.txt      curated index: one link per page, grouped by outline chapter.
// - llms-full.txt every current-version page concatenated, for full-text grounding.
//
// Current version only ("last doc"): the index points at the version served at
// the /docs root, mirroring tools/menu.mjs `createMenu('')`.
import { parse } from 'yaml'
import { existsSync, readFileSync, writeFileSync } from 'fs'

// Matches hugo.toml baseURL. The Hugo output is served at api-platform.com/docs/,
// so llms.txt is reachable at api-platform.com/docs/llms.txt.
const BASE = 'https://api-platform.com/docs'

function extractTitleFromMarkdown(content) {
  for (const line of content.split('\n')) {
    const result = line.match(/#\s(.*)/)
    if (result) {
      return result[1].trim()
    }
  }
  return null
}

// First prose paragraph after the H1, flattened to a single short line for the
// index. Returns '' when the page opens on something other than a paragraph
// (code block, table, list) so the index stays clean rather than carrying noise.
function firstParagraph(content) {
  const lines = content.split('\n')
  let i = 0

  // Skip a leading YAML front matter block if present.
  if (lines[0]?.trim() === '---') {
    i = 1
    while (i < lines.length && lines[i].trim() !== '---') i++
    i++
  }

  // Skip until past the first heading.
  while (i < lines.length && !/^#\s/.test(lines[i])) i++
  i++

  // Skip blank lines, then collect the first paragraph.
  while (i < lines.length && lines[i].trim() === '') i++
  const para = []
  while (i < lines.length && lines[i].trim() !== '') {
    para.push(lines[i].trim())
    i++
  }

  const text = para.join(' ')
  // Bail out on non-prose openers (admonitions, code, tables, lists, images).
  if (text === '' || /^([#>|*\-!]|```|<)/.test(para[0] ?? '')) {
    return ''
  }

  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length <= 160) {
    return cleaned
  }
  return cleaned.slice(0, 160).replace(/\s+\S*$/, '') + '…'
}

const currentVersion = readFileSync('./current-version.txt', { encoding: 'utf8' }).trim()
const outline = parse(readFileSync('./content/outline.yaml', { encoding: 'utf8' }))

let index = `# API Platform

> API Platform is a framework for building hypermedia REST and GraphQL APIs in PHP, integrated with Symfony and Laravel. This file indexes the current (${currentVersion}) documentation for large language models, per the llmstxt.org convention. Full text: ${BASE}/llms-full.txt
`

let full = `# API Platform documentation (${currentVersion})

Source: ${BASE}/
`

for (const chapter of outline.chapters) {
  index += `\n## ${chapter.title}\n\n`

  for (const item of chapter.items) {
    const filename = item === 'index' ? '_index' : item
    const file = `./content/${chapter.path}/${filename}.md`
    if (!existsSync(file)) {
      console.warn(`llms.txt: skipping missing ${file}`)
      continue
    }

    const content = readFileSync(file, { encoding: 'utf8' })
    const title = extractTitleFromMarkdown(content) || item
    const url = item === 'index' ? `${BASE}/${chapter.path}/` : `${BASE}/${chapter.path}/${item}/`
    const desc = firstParagraph(content)

    index += `- [${title}](${url})${desc ? `: ${desc}` : ''}\n`
    full += `\n\n---\n\n# ${title}\n\nSource: ${url}\n\n${content.trim()}\n`
  }
}

writeFileSync('./public/llms.txt', index)
writeFileSync('./public/llms-full.txt', full)

console.log(`llms.txt: wrote public/llms.txt and public/llms-full.txt for ${currentVersion}`)
