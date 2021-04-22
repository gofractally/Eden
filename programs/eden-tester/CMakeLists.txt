add_executable(eden-tester main.cpp)
target_link_libraries(eden-tester abieos state_history rodeos_lib chain)
set_target_properties(eden-tester PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
