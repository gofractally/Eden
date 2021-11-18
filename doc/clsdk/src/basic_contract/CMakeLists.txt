# All cmake projects need these
cmake_minimum_required(VERSION 3.16)
project(example)

# clsdk requires C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Libraries for building contracts and tests
find_package(clsdk REQUIRED)

# Build example.wasm contract
add_executable(example example.cpp)
target_link_libraries(example eosio-contract-simple-malloc)

# Generate example.abi
# This is a 2-step process:
#   * Build example.abi.wasm. This must link to eosio-contract-abigen.
#   * Run the wasm to generate the abi
add_executable(example-abigen example.cpp)
target_link_libraries(example-abigen eosio-contract-abigen)
add_custom_command(TARGET example-abigen POST_BUILD
    COMMAND cltester example-abigen.wasm >example.abi
)

# These symlinks help vscode
execute_process(COMMAND ln -sf ${clsdk_DIR} ${CMAKE_CURRENT_BINARY_DIR}/clsdk)
execute_process(COMMAND ln -sf ${WASI_SDK_PREFIX} ${CMAKE_CURRENT_BINARY_DIR}/wasi-sdk)

# Generate compile_commands.json to aid vscode and other editors
set(CMAKE_EXPORT_COMPILE_COMMANDS on)
