# Eden

## Build

Set the `WASI_SDK_PREFIX` environment variable before building (see architecture-specific instructions below). Alternatively, use cmake's `-DWASI_SDK_PREFIX=....` option.

```sh
git submodule update --init --recursive
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j
```

## Ubuntu 20.04

```sh
sudo apt-get update
sudo apt-get install -yq     \
    binaryen                 \
    build-essential          \
    cmake                    \
    git                      \
    libboost-all-dev         \
    libssl-dev               \
    libgmp-dev

export WASI_SDK_PREFIX=~/work/wasi-sdk-12.0

cd ~/work
wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
tar xf wasi-sdk-12.0-linux.tar.gz
```
