configure_file(include/badgechecker/_config.hpp.in ${CMAKE_BINARY_DIR}/generated/config_badge.hpp)
include_directories(${CMAKE_BINARY_DIR}/generated/)

function(add_badgechecker suffix)
    add_executable(badgechecker${suffix} src/badgechecker.cpp)
    target_include_directories(badgechecker${suffix} PUBLIC include/badgechecker)
    target_link_libraries(badgechecker${suffix} eosio-contract-simple-malloc${suffix})
    set_target_properties(badgechecker${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
endfunction()
add_badgechecker("")
add_badgechecker("-debug")

function(clsdk_badgechecker suffix)
    add_badgechecker("${suffix}-clsdk")
    set_target_properties(badgechecker${suffix}-clsdk PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)
    set_target_properties(badgechecker${suffix}-clsdk PROPERTIES OUTPUT_NAME badgechecker${suffix})
endfunction()
clsdk_badgechecker("")
clsdk_badgechecker("-debug")

add_executable(badgechecker-abigen src/badgechecker.cpp)
target_include_directories(badgechecker-abigen PUBLIC include/badgechecker)
target_link_libraries(badgechecker-abigen eosio-contract-abigen)
add_custom_command(TARGET badgechecker-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester badgechecker-abigen.wasm >${ROOT_BINARY_DIR}/badgechecker.abi
    COMMAND cp -a ${ROOT_BINARY_DIR}/badgechecker.abi ${ROOT_BINARY_DIR}/clsdk/contracts
)

configure_file(include/badgechecker/badgechecker.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/badgechecker/include/badgechecker/badgechecker.hpp COPYONLY)
# configure_file(include/badgechecker/badgechecker_ricardian.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/badgechecker/include/badgechecker/badgechecker_ricardian.hpp COPYONLY)
configure_file(src/badgechecker.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/badgechecker/src/badgechecker.cpp COPYONLY)

add_executable(test-badgechecker tests/test-badgechecker.cpp)
target_include_directories(test-badgechecker PUBLIC include/badgechecker)
target_link_libraries(test-badgechecker catch2 cltestlib)
set_target_properties(test-badgechecker PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-badgechecker)
