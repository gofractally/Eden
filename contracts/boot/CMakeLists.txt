add_executable(boot src/boot.cpp)
target_include_directories(boot PUBLIC include)
target_link_libraries(boot eosio-contract-simple-malloc)
set_target_properties(boot PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
