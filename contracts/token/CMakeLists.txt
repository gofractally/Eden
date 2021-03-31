add_executable(token src/token.cpp)
target_include_directories(token PUBLIC include)
target_link_libraries(token eosio-contract)
set_target_properties(token PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
