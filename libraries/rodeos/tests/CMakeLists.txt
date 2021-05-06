enable_testing()

if(DEFINED IS_WASM)
    add_subdirectory(wasm)
endif()
