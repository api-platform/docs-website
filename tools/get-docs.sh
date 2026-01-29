#!/bin/bash
# This script fetches api-platform/docs
root=$(pwd)

IFS=$'\n' read -d '' -r -a versions < docs-versions.txt

echo "===== DEBUG docs-versions.txt ====="
cat -A docs-versions.txt

echo "===== DEBUG versions array ====="
for v in "${versions[@]}"; do
  echo "-> \"$v\""
done

echo "==================================="

if [[ ! -d $root/docs.temp ]]; then
  git clone --depth=1 https://github.com/api-platform/docs docs.temp
  cd $root/docs.temp

  for version in "${versions[@]}"
  do
    git remote set-branches --add origin $version
  done

  git fetch --no-tags --depth=1 --multiple
else
  cd $root/docs.temp
fi

for version in "${versions[@]}"
do
  if [[ $version == "main" ]]; then
    git worktree add -f $root/content/$version origin/$version
  else
    git worktree add -f $root/content/v$version origin/$version
  fi
done

find $root/content/ -name "index.md" -exec sh -c 'f="{}"; mv -- "$f" "${f%index.md}_index.md"' \;
