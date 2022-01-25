add_executable(cltester main.cpp)
target_link_libraries(cltester abieos rodeos_lib debug_eos_vm chain)
set_target_properties(cltester PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
add_custom_command(TARGET cltester POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/bin
    COMMAND cp -a $<TARGET_FILE:cltester> ${ROOT_BINARY_DIR}/clsdk/bin
)

# TODO: find out why this is necessary. Without this,
# cltester, when compiled with gcc, produces
# "longjmp causes uninitialized stack frame"
# when the --subst option is used.
target_compile_options(cltester PRIVATE -D_FORTIFY_SOURCE=0)
