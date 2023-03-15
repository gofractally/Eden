#!/bin/bash
set -e

mkdir -p build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER_LAUNCHER=ccache -DCMAKE_C_COMPILER_LAUNCHER=ccache ..
make -j $(nproc)
ctest -j10 -V --rerun-failed --output-on-failure
cd ..