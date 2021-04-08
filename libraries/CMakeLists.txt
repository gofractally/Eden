add_subdirectory(abieos)

if(DEFINED IS_WASM)
    add_subdirectory(eosiolib)
endif()
