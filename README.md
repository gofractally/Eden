# Eden

## Eden Community Web App

### Running Eden Community Web App locally

```sh
yarn
yarn dev --stream
open http://localhost:3000
```

For more details, refer to the [Web App README](./packages/webapp/README.md).

## Eden Contracts

Contracts can be built manually (see below) but the latest contracts are also available from our Github CI/CD in this repo. For contract deployment/update instructions and considerations, see the [Contracts README](./contracts/README.md).

### Build

Set the `WASI_SDK_PREFIX` environment variable before building (see architecture-specific instructions below). Alternatively, use cmake's `-DWASI_SDK_PREFIX=....` option. Also make sure `nodejs 14`, `npm 6.14`, and `yarn 1.22` are in your path.

```sh
git submodule update --init --recursive
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j
ctest -j
```

To speed up builds, use `-DCMAKE_CXX_COMPILER_LAUNCHER=ccache -DCMAKE_C_COMPILER_LAUNCHER=ccache`

#### Ubuntu 20.04

```sh
sudo apt-get update
sudo apt-get install -yq    \
    binaryen                \
    build-essential         \
    cmake                   \
    git                     \
    libboost-all-dev        \
    libcurl4-openssl-dev    \
    libgbm-dev              \
    libgmp-dev              \
    libnss3-dev             \
    libssl-dev              \
    libusb-1.0-0-dev        \
    pkg-config              \
    wget

export WASI_SDK_PREFIX=~/work/wasi-sdk-12.0
export PATH=~/work/node-v14.16.0-linux-x64/bin:$PATH

cd ~/work
wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-12/wasi-sdk-12.0-linux.tar.gz
tar xf wasi-sdk-12.0-linux.tar.gz

wget https://nodejs.org/dist/v14.16.0/node-v14.16.0-linux-x64.tar.xz
tar xf node-v14.16.0-linux-x64.tar.xz
npm i -g yarn
```

### Running Eden with Ephemeral Chains Locally

Ephemeral chains are instances of the EOS blockchain spawned by `nodeos` locally, with manipulated data from our chain runners, eg: [Basic Genesis Runner](contracts/eden/tests/run-genesis.cpp) or [Full Election Runner](contracts/eden/tests/run-full-election.cpp). By running a ephemeral chain you are in full control of the blockchain, giving you more flexibility to test the Eden contracts.

#### Get the executables

You will need to build the repo locally by following the below **build** steps. If you don't have a proper C++ environment setup you can download it from our current [main branch artifacts](https://github.com/eoscommunity/Eden/actions/workflows/build.yml?query=branch%3Amain).

If you built locally, you can skip these steps.

**Downloading the executables**

-   Open our [main branch builds](https://github.com/eoscommunity/Eden/actions/workflows/build.yml?query=branch%3Amain).
-   Click in the most recent successful one
-   Scroll down to the artifacts section
-   Download the following files:
    -   Eden Microchain
    -   Ephemeral Eden Chains Runners
    -   clsdk
-   From the root of this repo, run the following commands:

```sh
mkdir build
# unzip all of the above artifact files in this build folder
cd build
tar -xvf clsdk-ubuntu-20-04.tar.gz clsdk/bin
cp ../scripts/eden_chain_runner.sh ./
```

Now you have all the files needed for running the ephemeral chain inside the `build` folder.

If you are on a Linux machine compatible with Ubuntu arch you can spin it up by just running: `./eden_chain_runner.sh run-genesis.wasm 1`

Otherwise you can spin it up with the following docker command:

```sh
docker run --name eden-genesis \
  -v "$(pwd)":/app \
  -w /app \
  -p 8080:8080 -p 8888:8888 \
  -d -it ghcr.io/eoscommunity/eden-builder:sub-chain \
  bash ./eden_chain_runner.sh run-genesis.wasm 1
```

To see if the chain is running successfully you can execute `cleos get info` or watch the nodeos logs: `tail -fn +1 eden-runner.log`

With the ephemeral chain running you can just spin up our local environment with:

```sh
yarn
NODE_ENV=test yarn build --stream
NODE_ENV=test yarn start --stream
open http://localhost:3000
```

**Re-running ephemeral chains**

Running the above commands again will just setup a brand new chain! Just watch out to kill nodeos and unlock your keos wallet if built locally or remove your docker container. Also don't forget to restart the `yarn` environment because the blocks state needs to be refreshed.

In the above instructions we ran a simple genesis case with 3 inducted members, but you can also try `run-full-election.wasm` to see a community with more than 100 members with chief delegates already elected.
