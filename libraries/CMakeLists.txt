enable_testing()

add_subdirectory(abieos)
add_subdirectory(clio)

if(DEFINED IS_WASM)
    add_subdirectory(eosiolib)
endif()
