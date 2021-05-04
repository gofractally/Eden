add_library(simple-malloc)
target_compile_options(simple-malloc PRIVATE -fno-exceptions -D__eosio_cdt__)
target_sources(simple-malloc PRIVATE simple_malloc.cpp)
add_custom_command(
    TARGET simple-malloc
    PRE_LINK
    COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc.a
    COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc.a dlmalloc.o
)

add_library(eosio-contracts-wasi-polyfill)
target_sources(eosio-contracts-wasi-polyfill PRIVATE
    contracts/wasi-polyfill/__wasi_fd_fdstat_get.cpp
    contracts/wasi-polyfill/__wasi_fd_close.cpp
    contracts/wasi-polyfill/__wasi_fd_seek.cpp
    contracts/wasi-polyfill/__wasi_fd_write.cpp
)
set_target_properties(eosio-contracts-wasi-polyfill PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

add_library(eosio-core)
target_link_libraries(eosio-core PUBLIC abieos boost)
target_include_directories(eosio-core PUBLIC core)
target_compile_options(eosio-core PUBLIC -fno-exceptions -D__eosio_cdt__)
target_sources(eosio-core PRIVATE crypto.cpp)
set_target_properties(eosio-core PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

add_library(eosio-contract-base)
target_link_libraries(eosio-contract-base PUBLIC eosio-core)
target_include_directories(eosio-contract-base PUBLIC contracts)
target_link_options(eosio-contract-base PUBLIC
    -Wl,--stack-first
    -Wl,--entry,apply
    -Wl,-z,stack-size=8192
    -nostdlib
)
target_sources(eosio-contract-base PRIVATE eosiolib.cpp)
set_target_properties(eosio-contract-base PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)
string(TOLOWER ${CMAKE_BUILD_TYPE} BUILD_TYPE_LOWER)
if(BUILD_TYPE_LOWER STREQUAL release OR BUILD_TYPE_LOWER STREQUAL minsizerel)
    target_link_options(eosio-contract-base INTERFACE -Wl,--strip-all)
endif()

# Contract with simple malloc/free
add_library(eosio-contract-simple-malloc INTERFACE)
target_link_libraries(eosio-contract-simple-malloc INTERFACE 
    eosio-contract-base
    -L${CMAKE_CURRENT_BINARY_DIR}
    -lc++
    -lc++abi
    -lc-no-malloc
    simple-malloc
    eosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

# Contract with full malloc/free
add_library(eosio-contract INTERFACE)
target_link_libraries(eosio-contract INTERFACE 
    eosio-contract-base
    -lc++
    -lc++abi
    -lc
    eosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

add_library(cltestlib)
target_sources(cltestlib PRIVATE
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
target_link_libraries(cltestlib PUBLIC boost eosio-core)
target_include_directories(cltestlib PUBLIC contracts tester)
target_link_options(cltestlib INTERFACE -Wl,--export-table)
set_target_properties(cltestlib PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

copy_headers(contracts/eosio eosiolib/contracts/include/eosio)
copy_headers(core eosiolib/core/include)
copy_headers(core/eosio eosiolib/core/include/eosio)
copy_headers(tester/eosio eosiolib/tester/include/eosio)
configure_file(simple_malloc.cpp ${ROOT_BINARY_DIR}/clsdk/eosiolib/simple_malloc.cpp COPYONLY)
configure_file(sdk/clsdk-cmake-args ${ROOT_BINARY_DIR}/clsdk/bin/clsdk-cmake-args COPYONLY)
configure_file(sdk/toolchain.cmake ${ROOT_BINARY_DIR}/clsdk/toolchain.cmake COPYONLY)
configure_file(sdk/clsdk-config.cmake ${ROOT_BINARY_DIR}/clsdk/clsdk-config.cmake COPYONLY)
