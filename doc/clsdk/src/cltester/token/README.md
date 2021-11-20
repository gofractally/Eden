# Token Support

Our test cases need to interact with the token contract in order to fully test our example. clsdk comes with a cltester-ready version of the token contract.

Example files:

* [testable.hpp](testable.hpp)
* [testable.cpp](testable.cpp)
* [tests.cpp](tests.cpp)
* [CMakeLists.txt](CMakeLists.txt)
* [.vscode/c_cpp_properties.json](.vscode/c_cpp_properties.json)
* [.vscode/settings.json](.vscode/settings.json)
* [.vscode/launch.json](.vscode/launch.json)

## Test cases

This demonstrates the following:
* Interacting with the token contract in tests
* Running multiple tests using multiple chains
* Creating helper functions to reduce repetition in tests

`tests.cpp`:
```cpp
{{#include tests.cpp}}
```

## Running the test

This builds the contract, builds the tests, and runs the tests:

```
mkdir build
cd build
cmake `clsdk-cmake-args` ..
make -j $(nproc)
cltester -v tests.wasm
```
