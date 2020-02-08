#!/usr/bin/env bash

version="$(grep -o 'version....[^\"]\{0,\}' package.json | cut -b 12-)"

docker build -t "axgn/achievements" -t "axgn/achievements:$version" .
