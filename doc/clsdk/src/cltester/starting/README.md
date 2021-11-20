# Getting Started

## Contract modifications

To simplify testing, the contract's class definition and table definitions should be in a header file.

This example is based on the [Debug Example](../../contract/debug/index.html), but has these additions:

* The contract source is now split into `testable.hpp` and `testable.cpp`
* CMakeLists.txt has a new rule to build `tests.wasm` from `tests.cpp` (below)
* `launch.json` now launches the test cases in cltester instead of starting nodeos

The files:

* [testable.hpp](testable.hpp)
* [testable.cpp](testable.cpp)
* [CMakeLists.txt](CMakeLists.txt)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)
* [.vscode/launch.json](.vscode/launch.json)

## Simple test case

`tests.cpp`:
```cpp
{{#include tests.cpp}}
```

## Running the test

This builds the contract and the test:

```
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
```

Use one of these to run the test:

```sh
cltester tests.wasm        # minimal logging
cltester -v tests.wasm     # show blockchain logging. This also
                           # shows any contract prints in green.
```
