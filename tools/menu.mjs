import { parse, stringify } from 'yaml'
import path from 'path'
import { mkdirpSync } from 'mkdirp'
import { globSync } from 'glob'
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'fs'
import matter from 'gray-matter';

function slugify(text) {
  return text
    .toString()                           // Cast to string (optional)
    .normalize('NFKD')            // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .toLowerCase()                  // Convert the string to lowercase letters
    .trim()                                  // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, '-')            // Replace spaces with -
    .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
}

function extractTitleFromMarkdown(content) {
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const result = line.match(/#\s(.*)/);

    if (null === result || result.length === 0) {
      continue;
    }

    return result[1];
  }

  return null;
}

function getColor(type) {
  switch (type.toLowerCase()) {
    case "class":
      return "bg-blue";
    case "interface":
      return "bg-[#c41d77]";
    case "trait":
      return "bg-[#7CB342]";
    case "attribute":
      return "bg-[#f09f17]";
    default:
      return "bg-[#6E6E6E]";
  }
}

let menu = ``

const versions = readFileSync('./docs-versions.txt', {encoding: 'utf8'}).split('\n').map((v) => v.trim()).filter(v => v)
versions.forEach((version) => {
  // API Reference _index generation
  if (existsSync(`./content/v${version}/references/`)) {
    let referenceIndex = ''
    const index = {}


      const links = globSync(`./content/v${version}/references/**/*.md`).filter(file => !file.includes("_index.md")).map((file) => {
        const {data} =  matter(readFileSync(file, {encoding: 'utf8'}).toString())
        const link = `/docs/v${file}`.replace('.md', '').replace('/content', '')
        const base = link.replace(`/docs/v${version}/references/`, '');
        let type = data['php-type']
        if (!type) {
          type = 'Class';
        }
        const parts = base.split("/");
        const fullLink = {
          type,
          title: parts[parts.length - 1],
          link,
          color: getColor(type),
        };
        const indexLink = parts.slice(0, -1).join("/");
        if (index[indexLink]) index[indexLink].unshift(fullLink);
        else index[indexLink] = [fullLink];
      })

    writeFileSync(`./content/v${version}/references/_index.md`, `
---
type: reference
---
`)
    mkdirpSync('./data/references')
    writeFileSync(`./data/references/v${version}.yaml`, stringify(index))
  }

  const file = readFileSync(`./content/v${version}/outline.yaml`, {encoding: 'utf8'})
  const data = parse(file)
  const menuVersion = `v${version.replace('.', '')}`

  data.chapters.forEach((e, i) => {
    const parentId = slugify(e.title)
    menu += `[[${menuVersion}]]
    name = "${e.title}"
    identifier = "${parentId}"
    pageRef = '/v${version}/${e.path}'
    weight = ${i + 1}
`
    const parent = e;
    e.items.forEach((f, j) => {
      let filename = f
      let path = `/v${version}/${parent.path}/${f}`
      if (f === 'index') {
        filename = '_index'
        path = `/v${version}/${parent.path}`
      }

      const title = extractTitleFromMarkdown(readFileSync(`./content/v${version}/${parent.path}/${filename}.md`, {encoding: 'utf8'}).toString())
    menu += `[[${menuVersion}]]
    name = "${title}"
    identifier = "${parentId}-${slugify(title)}"
    pageRef = '${path}'
    url = '${path}'
    weight = ${j+1}
    parent = '${parentId}'
`
    })
  })

  if (existsSync(`./content/v${version}/references`)) {
  menu += `[[${menuVersion}]]
    name = "API Reference"
    url = '/v${version}/references/'
    pageRef = '/v${version}/references/_index.md'
    weight = 3
`
  }

  if (existsSync(`./vcontent/${version}/guides`)) {
  menu += `[[${menuVersion}]]
    name = "Guides"
    url = '/v${version}/guides/'
    pageRef = '/v${version}/guides/_index.md'
    weight = 3
`

    const guides = readdirSync(`./content/v${version}/guides/`)
    guides.forEach((guide) => {
      const {data} =  matter(readFileSync(`./content/v${version}/guides/${guide}`, {encoding: 'utf8'}).toString())
      menu += `[[${menuVersion}]]
    name = "${data.name}"
    parent = "Guides"
    pageRef = "/v${version}/guides/${guide}"
    url = "/v${version}/guides/${data.slug}"
    weight = "${data.position}"
`
    })
  }

  menu += `[[${menuVersion}]]
    name = "Changelog"
    url = '/v${version}/changelog/'
    pageRef = '/v${version}/changelog/'
`

  menu += `[[${menuVersion}]]
    name = "Versions"
`

  versions.forEach((version) => {
    menu += `[[${menuVersion}]]
    name = "${version}"
    url = '/v${version}/distribution'
    weight = ${version === 'main' ? 0 : version.replace('.', '')}
    parent = "Versions"
`
  })

})

writeFileSync('config/_default/menus.toml', menu)
