FROM ghcr.io/eoscommunity/eden-builder:sub-chain

WORKDIR /app

COPY ./contracts ./contracts
COPY ./external ./external
COPY ./libraries  ./libraries
COPY ./native ./native
COPY ./programs ./programs
COPY ./wasm ./wasm
COPY CMakeLists.txt ./

WORKDIR /app/build
RUN cmake -DCMAKE_BUILD_TYPE=Release -DSKIP_TS=Yes -DEDEN_ATOMIC_ASSETS_ACCOUNT=atomicassets -DEDEN_ATOMIC_MARKET_ACCOUNT=atomicmarket -DEDEN_SCHEMA_NAME=members ..

RUN make -j$(nproc)

RUN ls -la

WORKDIR /app/build/clsdk/bin

RUN ls -la
# CMD ["nodeos"]
