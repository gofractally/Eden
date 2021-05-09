add_executable(token src/token.cpp)
target_include_directories(token PUBLIC include)
target_link_libraries(token eosio-contract-simple-malloc)
set_target_properties(token PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})

add_executable(token-abigen src/token.cpp)
target_include_directories(token-abigen PUBLIC include)
target_link_libraries(token-abigen eosio-contract-abigen)
add_custom_command(TARGET token-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester token-abigen.wasm >${ROOT_BINARY_DIR}/token.abi
    COMMAND cp -a ${ROOT_BINARY_DIR}/token.abi ${ROOT_BINARY_DIR}/clsdk/contracts
)

configure_file(include/token/token.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/token/token.hpp COPYONLY)
add_custom_command(TARGET token POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND cp -a $<TARGET_FILE:token> ${ROOT_BINARY_DIR}/clsdk/contracts
)

add_executable(test-token tests/test-token.cpp)
target_include_directories(test-token PUBLIC include)
target_link_libraries(test-token catch2 cltestlib)
set_target_properties(test-token PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-token)
