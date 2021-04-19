add_library(simple-malloc)
target_link_libraries(simple-malloc PUBLIC abieos)
target_compile_options(simple-malloc PUBLIC -fno-exceptions -D__eosio_cdt__)
target_sources(simple-malloc PRIVATE simple_malloc.cpp)

add_library(contracts-wasi-polyfill)
target_sources(contracts-wasi-polyfill PRIVATE
    contracts/wasi-polyfill/__wasi_fd_close.cpp
    contracts/wasi-polyfill/__wasi_fd_seek.cpp
    contracts/wasi-polyfill/__wasi_fd_write.cpp
)

add_library(eosio-core)
target_link_libraries(eosio-core PUBLIC abieos)
target_include_directories(eosio-core PUBLIC core)
target_compile_options(eosio-core PUBLIC -fno-exceptions -D__eosio_cdt__)
target_sources(eosio-core PRIVATE crypto.cpp)

add_library(eosio-contract-base INTERFACE)
target_link_libraries(eosio-contract-base INTERFACE eosio-core)
target_include_directories(eosio-contract-base INTERFACE contracts)
target_link_options(eosio-contract-base INTERFACE
    -Wl,--stack-first
    -Wl,--entry,apply
    -Wl,-z,stack-size=8192
    -Wl,--allow-undefined
    -nostdlib
)
string(TOLOWER ${CMAKE_BUILD_TYPE} BUILD_TYPE_LOWER)
if(BUILD_TYPE_LOWER STREQUAL release OR BUILD_TYPE_LOWER STREQUAL minsizerel)
    target_link_options(eosio-contract-base INTERFACE -Wl,--strip-all)
endif()

# Contract with simple malloc/free
add_library(eosio-contract-simple-malloc)
target_link_libraries(eosio-contract-simple-malloc PUBLIC 
    eosio-contract-base
    -L${CMAKE_CURRENT_BINARY_DIR}
    -lc++
    -lc++abi
    -lc-no-malloc
    simple-malloc
    contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)
add_custom_command(
    TARGET eosio-contract-simple-malloc
    PRE_LINK
    COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc.a
    COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc.a dlmalloc.o
)
target_sources(eosio-contract-simple-malloc PRIVATE eosiolib.cpp)

# Contract with full malloc/free
add_library(eosio-contract)
target_link_libraries(eosio-contract PUBLIC 
    eosio-contract-base
    -lc++
    -lc++abi
    -lc
    contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)
target_sources(eosio-contract PRIVATE eosiolib.cpp)
