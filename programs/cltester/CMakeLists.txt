add_executable(cltester main.cpp)
target_link_libraries(cltester abieos chain)
set_target_properties(cltester PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
