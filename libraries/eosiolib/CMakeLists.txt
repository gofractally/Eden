function(add_libs suffix)
    add_library(simple-malloc${suffix})
    target_link_libraries(simple-malloc${suffix} PUBLIC wasm-base${suffix})
    target_sources(simple-malloc${suffix} PRIVATE simple_malloc.cpp)
    add_custom_command(
        TARGET simple-malloc${suffix}
        PRE_LINK
        COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc${suffix}.a
        COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc${suffix}.a dlmalloc.o
    )

    add_library(eosio-contracts-wasi-polyfill${suffix})
    target_link_libraries(eosio-contracts-wasi-polyfill${suffix} PUBLIC wasm-base${suffix})
    target_sources(eosio-contracts-wasi-polyfill${suffix} PRIVATE
        contracts/wasi-polyfill/__wasi_fd_fdstat_get.cpp
        contracts/wasi-polyfill/__wasi_fd_close.cpp
        contracts/wasi-polyfill/__wasi_fd_seek.cpp
        contracts/wasi-polyfill/__wasi_fd_write.cpp
    )
    set_target_properties(eosio-contracts-wasi-polyfill${suffix} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

    add_library(eosio-core${suffix})
    target_link_libraries(eosio-core${suffix} PUBLIC wasm-base${suffix} abieos${suffix} boost)
    target_include_directories(eosio-core${suffix} PUBLIC core)
    target_sources(eosio-core${suffix} PRIVATE crypto.cpp)
    set_target_properties(eosio-core${suffix} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

    add_library(eosio-contract-base${suffix})
    target_link_libraries(eosio-contract-base${suffix} PUBLIC eosio-core${suffix})
    target_include_directories(eosio-contract-base${suffix} PUBLIC contracts)
    target_compile_options(eosio-contract-base${suffix} INTERFACE -DCOMPILING_CONTRACT)
    target_link_options(eosio-contract-base${suffix} PUBLIC
        -Wl,--stack-first
        -Wl,--entry,apply
        -Wl,-z,stack-size=8192
        -Wl,--no-merge-data-segments
        -nostdlib
    )
    target_sources(eosio-contract-base${suffix} PRIVATE eosiolib.cpp)
    set_target_properties(eosio-contract-base${suffix} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

    # Contract with simple malloc/free
    add_library(eosio-contract-simple-malloc${suffix} INTERFACE)
    target_link_libraries(eosio-contract-simple-malloc${suffix} INTERFACE 
        eosio-contract-base${suffix}
        -L${CMAKE_CURRENT_BINARY_DIR}
        -lc++
        -lc++abi
        -lc-no-malloc${suffix}
        simple-malloc${suffix}
        eosio-contracts-wasi-polyfill${suffix}
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )

    # Contract with full malloc/free
    add_library(eosio-contract${suffix} INTERFACE)
    target_link_libraries(eosio-contract${suffix} INTERFACE 
        eosio-contract-base${suffix}
        -lc++
        -lc++abi
        -lc
        eosio-contracts-wasi-polyfill${suffix}
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )

    add_library(eosio-contract-abigen${suffix})
    target_sources(eosio-contract-abigen${suffix} PRIVATE
        tester/tester_intrinsics.cpp
        tester/wasi_polyfill/__wasi_proc_exit.cpp
    )
    target_compile_options(eosio-contract-abigen${suffix} PUBLIC -DCOMPILING_ABIGEN)
    target_include_directories(eosio-contract-abigen${suffix} PUBLIC contracts)
    target_link_libraries(eosio-contract-abigen${suffix} PUBLIC
        boost
        eosio-core${suffix}
        -lc++
        -lc++abi
        -lc
        eosio-contracts-wasi-polyfill${suffix}
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
        ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/crt1.o
    )
    set_target_properties(eosio-contract-abigen${suffix} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)
    target_link_options(eosio-contract-abigen${suffix} PUBLIC
        -Wl,--entry,_start
        -nostdlib
    )

    add_library(cltestlib${suffix})
    target_sources(cltestlib${suffix} PRIVATE
        tester/tester.cpp
        tester/tester_intrinsics.cpp
        tester/wasi_polyfill/__wasi_args_get.cpp
        tester/wasi_polyfill/__wasi_args_sizes_get.cpp
        tester/wasi_polyfill/__wasi_clock_time_get.cpp
        tester/wasi_polyfill/__wasi_environ_get.cpp
        tester/wasi_polyfill/__wasi_environ_sizes_get.cpp
        tester/wasi_polyfill/__wasi_fd_close.cpp
        tester/wasi_polyfill/__wasi_fd_fdstat_get.cpp
        tester/wasi_polyfill/__wasi_fd_fdstat_set_flags.cpp
        tester/wasi_polyfill/__wasi_fd_prestat_dir_name.cpp
        tester/wasi_polyfill/__wasi_fd_prestat_get.cpp
        tester/wasi_polyfill/__wasi_fd_read.cpp
        tester/wasi_polyfill/__wasi_fd_seek.cpp
        tester/wasi_polyfill/__wasi_fd_write.cpp
        tester/wasi_polyfill/__wasi_path_open.cpp
        tester/wasi_polyfill/__wasi_proc_exit.cpp
    )
    target_link_libraries(cltestlib${suffix} PUBLIC 
        boost eosio-core${suffix}
        -lc++
        -lc++abi
        -lc
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
        ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/crt1.o
    )
    target_include_directories(cltestlib${suffix} PUBLIC contracts tester)
    target_link_options(cltestlib${suffix} INTERFACE -Wl,--export-table)
    set_target_properties(cltestlib${suffix} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)
    target_link_options(cltestlib${suffix} PUBLIC
        -Wl,--entry,_start
        -nostdlib
    )

    copy_headers(contracts/eosio eosiolib/contracts/include/eosio)
    copy_headers(core eosiolib/core/include)
    copy_headers(core/eosio eosiolib/core/include/eosio)
    copy_headers(tester/eosio eosiolib/tester/include/eosio)
    configure_file(simple_malloc.cpp ${ROOT_BINARY_DIR}/clsdk/eosiolib/simple_malloc.cpp COPYONLY)
    configure_file(sdk/clsdk-cmake-args ${ROOT_BINARY_DIR}/clsdk/bin/clsdk-cmake-args COPYONLY)
    configure_file(sdk/toolchain.cmake ${ROOT_BINARY_DIR}/clsdk/toolchain.cmake COPYONLY)
    configure_file(sdk/clsdk-config.cmake ${ROOT_BINARY_DIR}/clsdk/clsdk-config.cmake COPYONLY)
endfunction(add_libs)

add_libs("")
add_libs(-debug)
