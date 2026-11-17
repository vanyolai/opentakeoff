#!/bin/sh
set -eu

# Build the checked-out OpenTakeoff web source with the stack's Node 24
# Dockerfile, then publish only the verified static output to Apache.
#
# Expected layout (override the publish path with OPENTAKEOFF_PUBLISH_DIR):
#   /mnt/applications/stacks/opentakeoff/
#     Dockerfile
#     .dockerignore
#     source/                  <- this repository
#   /mnt/applications/data/production/opentakeoff/
#
# Usage:
#   ./deploy/apache/build-and-publish.sh          # current checkout
#   ./deploy/apache/build-and-publish.sh --pull   # ff-only pull current branch first

fail() {
  printf 'OpenTakeoff publish: %s\n' "$*" >&2
  exit 1
}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
STACK_DIR=$(CDPATH= cd -- "$REPO_DIR/.." && pwd)
PUBLISH_DIR=${OPENTAKEOFF_PUBLISH_DIR:-/mnt/applications/data/production/opentakeoff}
IMAGE_REF=${OPENTAKEOFF_BUILD_IMAGE:-local/opentakeoff-publish:latest}

case "${1:-}" in
  "") ;;
  --pull)
    [ -z "$(git -C "$REPO_DIR" status --porcelain)" ] || fail "the source checkout has uncommitted changes; refusing to pull"
    BRANCH=$(git -C "$REPO_DIR" branch --show-current)
    [ -n "$BRANCH" ] || fail "the source checkout is detached; select a branch before --pull"
    git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"
    ;;
  *) fail "usage: $0 [--pull]" ;;
esac

command -v docker >/dev/null 2>&1 || fail "docker is not installed"
command -v rsync >/dev/null 2>&1 || fail "rsync is not installed"
[ -f "$STACK_DIR/Dockerfile" ] || fail "missing $STACK_DIR/Dockerfile"
[ -d "$PUBLISH_DIR" ] || fail "missing $PUBLISH_DIR; create it as the deployment user first"
[ -w "$PUBLISH_DIR" ] || fail "$PUBLISH_DIR is not writable by the deployment user"
[ -n "$PUBLISH_DIR" ] && [ "$PUBLISH_DIR" != / ] || fail "unsafe publish directory"

PUBLISH_PARENT=$(dirname -- "$PUBLISH_DIR")
STAGE_DIR=$(mktemp -d "$PUBLISH_PARENT/.opentakeoff-stage.XXXXXX")
CONTAINER_ID=""

cleanup() {
  if [ -n "$CONTAINER_ID" ]; then
    docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
  fi
  case "$STAGE_DIR" in
    "$PUBLISH_PARENT"/.opentakeoff-stage.*) rm -rf -- "$STAGE_DIR" ;;
  esac
}
trap cleanup EXIT HUP INT TERM

printf 'Building %s from %s\n' "$IMAGE_REF" "$STACK_DIR"
docker build --pull --tag "$IMAGE_REF" "$STACK_DIR"

CONTAINER_ID=$(docker create "$IMAGE_REF")
docker cp "${CONTAINER_ID}:/usr/share/nginx/html/." "$STAGE_DIR/"

[ -s "$STAGE_DIR/index.html" ] || fail "build output has no non-empty index.html"
[ -d "$STAGE_DIR/assets" ] || fail "build output has no assets directory"

rsync -a --delete "$STAGE_DIR/" "$PUBLISH_DIR/"

REVISION=$(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || printf unknown)
printf 'Published OpenTakeoff %s to %s\n' "$REVISION" "$PUBLISH_DIR"
