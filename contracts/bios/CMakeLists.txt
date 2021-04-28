add_executable(bios src/bios.cpp)
target_include_directories(bios PUBLIC include)
target_link_libraries(bios eosio-contract-simple-malloc)
set_target_properties(bios PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
