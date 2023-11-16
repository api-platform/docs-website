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
# run hugo to build public/
cd ../../
hugo
```

## Dev 

In `themes/api-platform` run `npm run build -- --watch`
Run `hugo serve`
