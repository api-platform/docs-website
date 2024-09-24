#!/bin/bash
# This script fetches api-platform/core to retrieve guides and references
root=$(pwd)
IFS=$'\n' read -d '' -r -a versions < docs-versions.txt
current_version=$(cat $root/current-version.txt)

phive install --trust-gpg-keys 62D05354C61458CB8378FD323F82299C64F51AD2 --copy php-documentation-generator/php-documentation-generator

if [[ ! -d $root/core.temp ]];
then
  git clone -b main --single-branch --depth=1 https://github.com/api-platform/core core.temp
fi

cd core.temp

export PDG_AUTOLOAD=$root/core.temp/vendor/autoload.php

for version in "${versions[@]}"
do
  git restore .
	git fetch --depth=1 origin $version
	git branch -D temp-$version
	git checkout FETCH_HEAD -b temp-$version
  git reset --hard FETCH_HEAD

  if [[ $version == "main" ]]; then
    mkdir -p "$root/content/$version/changelog" && cp $root/core.temp/CHANGELOG.md $root/content/$version/changelog/_index.md
  else
    mkdir -p "$root/content/v$version/changelog" && cp "$root/core.temp/CHANGELOG.md" "$root/content/v$version/changelog/_index.md"
  fi

	if [[ -d $root/core.temp/docs/guides ]];
	then
    cd $root/core.temp
		rm -f composer.lock
		composer update --prefer-dist --ignore-platform-req=ext-mongodb
		cd $root/core.temp/docs
		cp $root/pdg.config.yaml pdg.config.yaml

    if [[ $version == "main" ]]; then
      $root/tools/pdg guides --quiet --no-debug $root/content/$version/guides
      # $root/tools/pdg references --quiet --no-debug $root/core.temp/src $root/content/$version/references/ --base-url /docs/$version/references
    elif [[ $version == $current_version ]]; then
      $root/tools/pdg guides --quiet --no-debug $root/content/v$version/guides
      # $root/tools/pdg references --quiet --no-debug $root/core.temp/src $root/content/v$version/references/ --base-url /docs/references
    else
      $root/tools/pdg guides --quiet --no-debug $root/content/v$version/guides
      # $root/tools/pdg references --quiet --no-debug $root/core.temp/src $root/content/v$version/references/ --base-url /docs/v$version/references
    fi
	fi
done

cp -r $root/content/v$current_version/* $root/content/
rm -r $root/content/v$current_version
