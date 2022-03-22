enable_testing()
add_subdirectory(abieos)

if(DEFINED IS_WASM)
    add_subdirectory(eosiolib)
endif()

if(DEFINED IS_NATIVE)
    add_subdirectory(debug_eos_vm)
endif()

add_subdirectory(clchain)
