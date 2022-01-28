enable_testing()

add_executable(get-code contracts/get-code.cpp)
target_link_libraries(get-code eosio-contract-simple-malloc)
set_target_properties(get-code PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/test-contracts)

add_executable(get-code-abigen contracts/get-code.cpp)
target_link_libraries(get-code-abigen eosio-contract-abigen)
add_custom_command(TARGET get-code-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/test-contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester get-code-abigen.wasm >${ROOT_BINARY_DIR}/test-contracts/get-code.abi
)

add_executable(test-sdk test-sdk.cpp)
target_include_directories(test-sdk PUBLIC include ${ROOT_SOURCE_DIR}/contracts/bios/include)
target_link_libraries(test-sdk catch2 cltestlib)
set_target_properties(test-sdk PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-sdk)
