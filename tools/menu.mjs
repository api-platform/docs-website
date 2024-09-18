import { parse, stringify } from 'yaml'
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

function createMenu(pathVersion, menuVersion, currentVersion) {
  let menu = ``
  // API Reference _index generation
  if (existsSync(`./content${pathVersion}/references/`)) {
    const index = {}
    globSync(`./content${pathVersion}/references/**/*.md`).filter(file => !file.includes("_index.md")).forEach((file) => {
      const {data} =  matter(readFileSync(file, {encoding: 'utf8'}).toString())
      const link = `/docs/${file}`.replace('.md', '').replace('/content', '')
      const base = link.replace(`/docs${pathVersion}/references/`, '');
      let type = data['php-type']
      if (!type) {
        type = 'Class';
      }
      const parts = base.split("/");
      const fullLink = {
        type,
        title: parts[parts.length - 1],
        link: link + "/",
        color: getColor(type),
        parts: parts
      };
      const indexLink = parts.slice(0, -1).join("/");
      if (index[indexLink]) index[indexLink].unshift(fullLink);
      else index[indexLink] = [fullLink];
    })

    writeFileSync(`./content${pathVersion}/references/_index.md`, `---
type: reference
---`)
    mkdirpSync('./data/references')
    const referenceDataFilename = pathVersion === '' ? '/references' : pathVersion;
    writeFileSync(`./data/references${referenceDataFilename}.yaml`, stringify(index))
  }

  const file = readFileSync(`./content${pathVersion}/outline.yaml`, {encoding: 'utf8'})
  const data = parse(file)

  data.chapters.forEach((e, i) => {
    const parentId = slugify(e.title)
    menu += `[[${menuVersion}]]
      name = "${e.title}"
      identifier = "${parentId}"
      pageRef = '${pathVersion}/${e.path}'
      weight = ${i + 1}
`
    const parent = e;
    e.items.forEach((f, j) => {
      let filename = f
      let path = `${pathVersion}/${parent.path}/${f}`
      if (f === 'index') {
        filename = '_index'
        path = `${pathVersion}/${parent.path}`
      }

      const title = extractTitleFromMarkdown(readFileSync(`./content${pathVersion}/${parent.path}/${filename}.md`, {encoding: 'utf8'}).toString())
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

  if (existsSync(`./content${pathVersion}/references`)) {
    menu += `[[${menuVersion}]]
      name = "API Reference"
      url = '${pathVersion}/references/'
      pageRef = '${pathVersion}/references/_index.md'
      weight = 3
`
  }

  if (existsSync(`./content${pathVersion}/guides`)) {
    menu += `[[${menuVersion}]]
      name = "Guides"
      url = '${pathVersion}/guides/'
      pageRef = '${pathVersion}/guides/_index.md'
      weight = 3
`

    const guides = readdirSync(`./content${pathVersion}/guides/`)
    guides.forEach((guide) => {
      const {data} =  matter(readFileSync(`./content${pathVersion}/guides/${guide}`, {encoding: 'utf8'}).toString())
      menu += `[[${menuVersion}]]
      name = "${data.name}"
      parent = "Guides"
      pageRef = "${pathVersion}/guides/${guide}"
      url = "${pathVersion}/guides/${data.slug}"
      weight = "${data.position}"
`
    })
  }

  menu += `[[${menuVersion}]]
      name = "Changelog"
      url = '${pathVersion}/changelog/'
      pageRef = '${pathVersion}/changelog/'
`

  menu += `[[${menuVersion}]]
      name = "Versions"
`

  versions.forEach((version, i) => {
    if (version === currentVersion) {
      menu += `[[${menuVersion}]]
      name = "${version} (current)"
      url = '/'
      weight = ${i + 1} 
      parent = "Versions"
`
      return;

    }

    const pVer = version === 'main' ? version : `v${version}`
    menu += `[[${menuVersion}]]
      name = "${version === 'main' ? "main (dev)" : version}"
      url = '/${pVer}/'
      weight = ${i + 1}
      parent = "Versions"
`
  })

  return menu
}

let menu = ``

const currentVersion = readFileSync('./current-version.txt', {encoding: 'utf8'}).trim()
const versions = readFileSync('./docs-versions.txt', {encoding: 'utf8'})
  .split('\n')
  .map((v) => v.trim())
  .filter(v => v)

versions.forEach((version) => {
  if (version === currentVersion) {
    return;
  }

  const pathVersion = version === 'main' ? `/${version}` : `/v${version}`
  const menuVersion = version === 'main' ? 'main' : `v${version.replace('.', '')}`
  menu += createMenu(pathVersion, menuVersion, currentVersion)
})

menu += createMenu('', 'current', currentVersion)

writeFileSync('config/_default/menus.toml', menu)
