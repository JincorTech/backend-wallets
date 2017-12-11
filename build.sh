#!/usr/bin/env bash
TAG="$(git rev-parse --short HEAD)"
docker build -t jincort/backend-wallets:${TAG} -f Dockerfile.prod .
docker push jincort/backend-wallets:${TAG}