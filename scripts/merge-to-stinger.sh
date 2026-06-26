#!/usr/bin/env bash
# Merge Android + docs into StiNgeRIsrael/tamir-li and push (run locally with YOUR GitHub login).
set -euo pipefail

STINGER_REPO="${STINGER_REPO:-https://github.com/StiNgeRIsrael/tamir-li.git}"
SOURCE_BRANCH="${SOURCE_BRANCH:-feat/android-capacitor-production}"
SOURCE_REMOTE="${SOURCE_REMOTE:-https://github.com/Parlamentum/tamir-li.git}"

WORKDIR="${WORKDIR:-/tmp/tamir-li-merge}"
rm -rf "$WORKDIR"
git clone "$STINGER_REPO" "$WORKDIR"
cd "$WORKDIR"
git remote add parlamento "$SOURCE_REMOTE" 2>/dev/null || git remote set-url parlamento "$SOURCE_REMOTE"
git fetch parlamento "$SOURCE_BRANCH"
git checkout main
git merge "parlamento/$SOURCE_BRANCH" -m "feat(android): Capacitor AdMob, Google Play Billing, doc refresh"
git push origin main
echo ""
echo "Done. Deploy: https://github.com/StiNgeRIsrael/tamir-li/actions/workflows/deploy-plesk.yml"
