#!/bin/bash
# This script fetches api-platform/docs
root=$(pwd)

IFS=$'\n' read -d '' -r -a versions < docs-versions.txt

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
	git worktree add $root/content/$version origin/$version
done

find $root/content/ -name "index.md" -exec sh -c 'f="{}"; mv -- "$f" "${f%index.md}_index.md"' \;
