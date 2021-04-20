enable_testing()
add_subdirectory(abieos)

if(DEFINED IS_WASM)
    add_subdirectory(eosiolib)
endif()

if(DEFINED IS_NATIVE)
    add_subdirectory(chain_kv)
    add_subdirectory(rodeos)
endif()
