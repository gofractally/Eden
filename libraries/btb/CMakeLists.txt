find_package(OpenSSL REQUIRED Crypto)

function(add suffix)
    add_library(btb${suffix})
    target_link_libraries(btb${suffix} PUBLIC abieos${suffix} boost OpenSSL::Crypto)
    target_include_directories(btb${suffix} PUBLIC include)
    target_sources(btb${suffix} PRIVATE
        src/crypto.cpp
    )
    if(DEFINED IS_WASM)
        target_link_libraries(btb${suffix} PUBLIC wasm-base${suffix})
        target_sources(btb${suffix} PRIVATE
            wasi-polyfill/__wasi_environ_get.cpp
            wasi-polyfill/__wasi_environ_sizes_get.cpp
            wasi-polyfill/__wasi_fd_read.cpp
            wasi-polyfill/__wasi_proc_exit.cpp
            wasi-polyfill/eosio_assert.cpp
            wasi-polyfill/print.cpp
        )
    endif()
endfunction()

add("")
if(DEFINED IS_WASM)
    add("-debug")
    copy_headers(include/btb btb/include/btb)
endif()
