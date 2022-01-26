# All cmake projects need these
cmake_minimum_required(VERSION 3.16)
project(notify)

# clsdk requires C++20
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Libraries for building contracts and tests
find_package(clsdk REQUIRED)

# Build notify.wasm contract
add_executable(notify notify.cpp)
target_link_libraries(notify eosio-contract-simple-malloc)

# Build notify-debug.wasm
# This is like notify.wasm, but includes debugging information.
add_executable(notify-debug notify.cpp)
target_link_libraries(notify-debug eosio-contract-simple-malloc-debug)

# Generate notify.abi
# This is a 2-step process:
#   * Build notify.abi.wasm. This must link to eosio-contract-abigen.
#   * Run the wasm to generate the abi
add_executable(notify-abigen notify.cpp)
target_link_libraries(notify-abigen eosio-contract-abigen)
add_custom_command(TARGET notify-abigen POST_BUILD
    COMMAND cltester notify-abigen.wasm >notify.abi
)

# These symlinks help vscode
execute_process(COMMAND ln -sf ${clsdk_DIR} ${CMAKE_CURRENT_BINARY_DIR}/clsdk)
execute_process(COMMAND ln -sf ${WASI_SDK_PREFIX} ${CMAKE_CURRENT_BINARY_DIR}/wasi-sdk)

# Generate compile_commands.json to aid vscode and other editors
set(CMAKE_EXPORT_COMPILE_COMMANDS on)
