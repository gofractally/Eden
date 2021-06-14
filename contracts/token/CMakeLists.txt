function(add_token suffix)
    add_executable(token${suffix} src/token.cpp)
    target_include_directories(token${suffix} PUBLIC include)
    target_link_libraries(token${suffix} eosio-contract-simple-malloc${suffix})
    set_target_properties(token${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
endfunction()
add_token("")
add_token("-debug")

function(clsdk_token suffix)
    add_token("${suffix}-clsdk")
    set_target_properties(token${suffix}-clsdk PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)
    set_target_properties(token${suffix}-clsdk PROPERTIES OUTPUT_NAME token${suffix})
endfunction()
clsdk_token("")
clsdk_token("-debug")

add_executable(token-abigen src/token.cpp)
target_include_directories(token-abigen PUBLIC include)
target_link_libraries(token-abigen eosio-contract-abigen)
add_custom_command(TARGET token-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester token-abigen.wasm >${ROOT_BINARY_DIR}/token.abi
    COMMAND cp -a ${ROOT_BINARY_DIR}/token.abi ${ROOT_BINARY_DIR}/clsdk/contracts
)

configure_file(include/token/token.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/token/include/token/token.hpp COPYONLY)
configure_file(include/token/token_ricardian.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/token/include/token/token_ricardian.hpp COPYONLY)
configure_file(src/token.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/token/src/token.cpp COPYONLY)

add_executable(test-token tests/test-token.cpp)
target_include_directories(test-token PUBLIC include)
target_link_libraries(test-token catch2 cltestlib)
set_target_properties(test-token PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-token)
