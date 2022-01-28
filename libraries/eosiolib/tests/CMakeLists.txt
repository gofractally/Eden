enable_testing()

add_executable(get-code contracts/get-code.cpp)
target_include_directories(get-code PUBLIC include)
target_link_libraries(get-code eosio-contract-simple-malloc)
set_target_properties(get-code PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/test-contracts)

add_executable(test-sdk test-sdk.cpp)
target_include_directories(test-sdk PUBLIC include ${ROOT_SOURCE_DIR}/contracts/bios/include)
target_link_libraries(test-sdk catch2 cltestlib)
set_target_properties(test-sdk PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-sdk)
