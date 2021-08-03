if(DEFINED IS_NATIVE)
    add_subdirectory(cltester)
    add_subdirectory(rodeos)
endif()

if(DEFINED IS_WASM)
    add_subdirectory(eden-micro-chain)
endif()
