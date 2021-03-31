if(DEFINED IS_WASM)
    set(ABIEOS_ONLY_LIBRARY TRUE)
    add_subdirectory(abieos)
endif()
