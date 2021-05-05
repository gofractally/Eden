add_executable(cltester main.cpp)
target_link_libraries(cltester abieos state_history rodeos_lib chain)
set_target_properties(cltester PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
add_custom_command(TARGET cltester POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/bin
    COMMAND cp -a $<TARGET_FILE:cltester> ${ROOT_BINARY_DIR}/clsdk/bin
)
