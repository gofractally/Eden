# cltester: Debugging using gdb command line

You should have the following project tree:

```
<project root>/
   CMakeLists.txt
   testable.hpp
   testable.cpp
   tests.cpp
   build/         (Created by build step)
      clsdk -> ....
      testable-debug.wasm
      testable.abi
      testable.wasm
      tests.wasm
      wasi-sdk -> ....
```

To start a debug session on the command line:

```
cd build
gdb -q --args                                \
   ./clsdk/bin/cltester                      \
   --subst testable.wasm testable-debug.wasm \
   -v                                        \
   tests.wasm
```

Ignore `No debugging symbols found in ...`; it will load debugging symbols for the wasm files instead.

The following gdb commands set options gdb needs to function, set some breakpoints, and start cltester.

```
handle SIG34 noprint
set breakpoint pending on
set substitute-path clsdk-wasi-sdk: wasi-sdk
set substitute-path clsdk: clsdk
b example_contract::notify_transfer
b example_contract::buydog
run
```
