enable_testing()
add_subdirectory(abieos)

if(DEFINED IS_WASM)
    add_subdirectory(eosiolib)
endif()

if(DEFINED IS_NATIVE)
    add_subdirectory(chain_kv)
    add_subdirectory(debug_eos_vm)
    add_subdirectory(state_history)
endif()

add_subdirectory(rodeos)
