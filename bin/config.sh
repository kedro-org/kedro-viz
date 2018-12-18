#!/usr/bin/env sh
set -e
DIR=$(dirname $0)
FIELD=$1
cd $DIR/../

node -e "console.log(require('./package.json').$FIELD);"
