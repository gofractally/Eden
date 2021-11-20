# All cmake projects need these
cmake_minimum_required(VERSION 3.16)
project(testable)

# clsdk requires C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Libraries for building contracts and tests
find_package(clsdk REQUIRED)

# Build testable.wasm contract
add_executable(testable testable.cpp)
target_link_libraries(testable eosio-contract-simple-malloc)

# Build testable-debug.wasm
# This is like testable.wasm, but includes debugging information.
add_executable(testable-debug testable.cpp)
target_link_libraries(testable-debug eosio-contract-simple-malloc-debug)

# Generate testable.abi
# This is a 2-step process:
#   * Build testable.abi.wasm. This must link to eosio-contract-abigen.
#   * Run the wasm to generate the abi
add_executable(testable-abigen testable.cpp)
target_link_libraries(testable-abigen eosio-contract-abigen)
add_custom_command(TARGET testable-abigen POST_BUILD
    COMMAND cltester testable-abigen.wasm >testable.abi
)

# Builds tests.wasm
# Tests must link to either cltestlib (runs faster) or cltestlib-debug (supports debugging)
add_executable(tests tests.cpp)
target_link_libraries(tests cltestlib-debug)

# These symlinks help vscode
execute_process(COMMAND ln -sf ${clsdk_DIR} ${CMAKE_CURRENT_BINARY_DIR}/clsdk)
execute_process(COMMAND ln -sf ${WASI_SDK_PREFIX} ${CMAKE_CURRENT_BINARY_DIR}/wasi-sdk)

# Generate compile_commands.json to aid vscode and other editors
set(CMAKE_EXPORT_COMPILE_COMMANDS on)
