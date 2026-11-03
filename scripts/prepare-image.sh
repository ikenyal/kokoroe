#!/usr/bin/env bash
# Build on the host and assemble the runtime files for the container image in .image/ (D-034).
# Why: building Next.js (Turbopack, native Rust) under linux/amd64 emulation segfaults in qemu; the runtime itself is plain JS.
# The image is then built from .image/ with Dockerfile.prebuilt, which runs no commands (no emulation needed).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf .next/standalone .image
npm run build
mkdir -p .image/.next .image/data
cp -R .next/standalone/. .image/
cp -R .next/static .image/.next/static
cp -R public .image/public
cp -R data/demo .image/data/demo
# Platform-specific binaries built for this Mac must not ship (only sharp, unused with images.unoptimized).
rm -rf .image/node_modules/sharp .image/node_modules/@img
cp Dockerfile.prebuilt .image/Dockerfile
if find .image -name "*.node" | grep -q .; then echo "native modules left in .image:"; find .image -name "*.node"; exit 1; fi
if find .image -name ".env*" | grep -q .; then echo "env file in .image — refusing"; exit 1; fi
echo "ready: .image ($(du -sh .image | cut -f1))"
