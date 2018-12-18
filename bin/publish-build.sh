#!/usr/bin/env sh
set -e
DIR=$(dirname $0)
cd $DIR/../

echo "==== Run 'Publish new tagged build version' task ==="

FE__VERSION=$(./bin/config.sh version)
NEW_VERSION="$1"
MAIN_BRANCH="master"
DEVELOP_BRANCH="develop"
BUILD_BRANCH="build"

if [[ -z "$NEW_VERSION" ]]; then
    echo "You should enter a new version..."
    exit 2;
fi

echo "Current version is "$FE__VERSION". Version will be updated to: "$NEW_VERSION

git checkout $DEVELOP_BRANCH
git pull origin $DEVELOP_BRANCH
npm version $NEW_VERSION
git push origin $DEVELOP_BRANCH --tags
git checkout $MAIN_BRANCH
git merge $DEVELOP_BRANCH --ff
git push origin $MAIN_BRANCH --tags
git checkout $BUILD_BRANCH
git merge $DEVELOP_BRANCH --no-edit
npm run lib
git add . || :
git commit -m "Build: $NEW_VERSION" || :
git tag v$NEW_VERSION-build
git push origin $BUILD_BRANCH --tags
git checkout $DEVELOP_BRANCH
npm publish

echo "Done."
