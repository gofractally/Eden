#!/usr/bin/env sh
set -e
docker build -t ghcr.io/eoscommunity/eden-builder:latest .
docker run \
    --rm \
    --mount type=bind,src="$PWD",target=/workspace \
    --workdir /workspace \
    eden-builder:latest bash -c "
        set -e
        mkdir -p build-docker
        cd build-docker
        cmake -DCMAKE_BUILD_TYPE=Release ..
        make -j
        ctest -j10
"
