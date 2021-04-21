FROM ubuntu:focal

RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get install -yq      \
        binaryen                \
        build-essential         \
        cmake                   \
        curl                    \
        git                     \
        libboost-all-dev        \
        libcurl4-openssl-dev    \
        libgmp-dev              \
        libssl-dev              \
        libusb-1.0-0-dev        \
        pkg-config              \
    && apt-get clean -yq \
    && rm -rf /var/lib/apt/lists/*

RUN cd /opt \
    && curl -LO https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz \
    && tar xf wasi-sdk-12.0-linux.tar.gz \
    && curl -LO https://nodejs.org/dist/v14.16.0/node-v14.16.0-linux-x64.tar.xz \
    && tar xf node-v14.16.0-linux-x64.tar.xz \
    && export PATH="/opt/node-v14.16.0-linux-x64/bin:$PATH" \
    && npm i -g yarn

ENV WASI_SDK_PREFIX=/opt/wasi-sdk-12.0
ENV PATH=/opt/node-v14.16.0-linux-x64/bin:$PATH
