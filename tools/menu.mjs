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
  if (existsSync(`./content/${version}/reference/`)) {
    let referenceIndex = ''
    const index = {}


      const links = globSync(`./content/${version}/reference/**/*.md`).filter(file => !file.includes("_index.md")).map((file) => {
        const {data} =  matter(readFileSync(file, {encoding: 'utf8'}).toString())
        const link = `/docs/${file}`.replace('.md', '').replace('/content', '')
        const base = link.replace(`/docs/${version}/reference/`, '');
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

    writeFileSync(`./content/${version}/reference/_index.md`, `
---
type: reference
---
`)
    mkdirpSync('./data/reference')
    writeFileSync(`./data/reference/${version}.yaml`, stringify(index))
  }

  const file = readFileSync(`./content/${version}/outline.yaml`, {encoding: 'utf8'})
  const data = parse(file)
  const menuVersion = version.replace('.', '')

  data.chapters.forEach((e, i) => {
    const parentId = slugify(e.title)
    menu += `[[${menuVersion}]]
    name = "${e.title}"
    identifier = "${parentId}"
    pageRef = '/${version}/${e.path}'
    weight = ${i + 1}
`
    const parent = e;
    e.items.forEach((f, j) => {
      let filename = f
      let path = `/${version}/${parent.path}/${f}`
      if (f === 'index') {
        filename = '_index'
        path = `/${version}/${parent.path}`
      }

      const title = extractTitleFromMarkdown(readFileSync(`./content/${version}/${parent.path}/${filename}.md`, {encoding: 'utf8'}).toString())
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

  if (existsSync(`./content/${version}/reference`)) {
  menu += `[[${menuVersion}]]
    name = "API Reference"
    url = '/${version}/reference/'
    weight = 3
`
  }

  if (existsSync(`./content/${version}/guides`)) {
  menu += `[[${menuVersion}]]
    name = "Guides"
    url = '/${version}/guides/'
    weight = 3
`

    const guides = readdirSync(`./content/${version}/guides/`)
    guides.forEach((guide) => {
      const {data} =  matter(readFileSync(`./content/${version}/guides/${guide}`, {encoding: 'utf8'}).toString())
      menu += `[[${menuVersion}]]
    name = "${data.name}"
    parent = "Guides"
    pageRef = "/${version}/guides/${guide}"
    url = "/${version}/guides/${data.slug}"
    weight = "${data.position}"
`
    })
  }

  menu += `[[${menuVersion}]]
    name = "Changelog"
    url = '/${version}/changelog/'
`

  menu += `[[${menuVersion}]]
    name = "Versions"
`

  versions.forEach((version) => {
    menu += `[[${menuVersion}]]
    name = "${version}"
    url = '/${version}/distribution'
    weight = ${version === 'main' ? 0 : version.replace('.', '')}
    parent = "Versions"
`

  })

})

writeFileSync('config/_default/menus.toml', menu)
