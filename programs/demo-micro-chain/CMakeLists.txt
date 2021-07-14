function(add suffix)
    add_executable(demo-micro-chain${suffix}
        demo-micro-chain.cpp
    )
    target_link_libraries(demo-micro-chain${suffix} clchain${suffix} eosio-contracts-wasi-polyfill${suffix})
    target_include_directories(demo-micro-chain${suffix} PRIVATE
        ${CMAKE_BINARY_DIR}/generated/
        ../../contracts/eden/include
        ../../libraries/eosiolib/contracts/include
        ../../libraries/eosiolib/core/include
    )
    set_target_properties(demo-micro-chain${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
    target_link_options(demo-micro-chain${suffix} PRIVATE
        -Wl,--stack-first
        -Wl,--no-entry
        -Wl,-z,stack-size=8192
        -nostdlib
        -lc++
        -lc++abi
        -lc
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )
    add_dependencies(demo-micro-chain${suffix} eden)
endfunction()
add("")
add("-debug")
