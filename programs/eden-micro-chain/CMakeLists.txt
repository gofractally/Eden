function(add suffix)
    add_executable(eden-micro-chain${suffix}
        eden-micro-chain.cpp
    )
    target_link_libraries(eden-micro-chain${suffix} clchain${suffix} eosio-contracts-wasi-polyfill${suffix})
    target_include_directories(eden-micro-chain${suffix} PRIVATE
        ${CMAKE_BINARY_DIR}/generated/
        ../../contracts/eden/include
        ../../libraries/eosiolib/contracts/include
        ../../libraries/eosiolib/core/include
    )
    set_target_properties(eden-micro-chain${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
    target_link_options(eden-micro-chain${suffix} PRIVATE
        -Wl,--stack-first
        -Wl,--no-entry
        -Wl,-z,stack-size=8192
        -nostdlib
        -lc++
        -lc++abi
        -lc
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )
    add_dependencies(eden-micro-chain${suffix} eden)
endfunction()
add("")
# add("-debug")
