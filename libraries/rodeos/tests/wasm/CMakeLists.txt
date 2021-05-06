add_executable(test-db-contract test-db-contract.cpp)
target_link_libraries(test-db-contract eosio-contract)
set_target_properties(test-db-contract PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
configure_file(test-db-contract.abi ${ROOT_BINARY_DIR}/test-db-contract.abi COPYONLY)

add_executable(test-db test-db.cpp)
target_link_libraries(test-db catch2 cltestlib)
set_target_properties(test-db PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-db)
