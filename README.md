# API Platform documentation website

## Build

```
npm install
# fetches api-platform/docs
bash tools/get-docs.sh
# fetches api-platform/core for reference and guides
bash tools/get-core-docs.sh
# builds the config/_default/menu.toml according to the outline.yaml from api-platform/docs
node tools/menu.mjs
# build our tailwind theme
cd themes/api-platform
npm install
npm run build
# run hugo to build public/ (also emits llms.txt and llms-full.txt for the
# current version, via the index.llms*.txt templates and [outputs] in hugo.toml)
cd ../../
hugo
# generate public/llms.txt and public/llms-full.txt (current version, llmstxt.org)
node tools/llms.mjs
```

## Dev 

In `themes/api-platform` run `npm run build -- --watch`
Run `hugo serve`
