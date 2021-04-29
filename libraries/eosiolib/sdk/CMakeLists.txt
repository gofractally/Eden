add_library(boost INTERFACE)
target_include_directories(boost INTERFACE boost)

add_library(abieos INTERFACE)
target_include_directories(abieos INTERFACE abieos)

add_library(simple-malloc EXCLUDE_FROM_ALL)
target_compile_options(simple-malloc PRIVATE -fno-exceptions -D__eosio_cdt__)
target_sources(simple-malloc PRIVATE eosiolib/simple_malloc.cpp)
add_custom_command(
    TARGET simple-malloc
    PRE_LINK
    COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc.a
    COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc.a dlmalloc.o
)

add_library(eosio-core INTERFACE)
target_include_directories(eosio-core INTERFACE eosiolib/core)
target_compile_options(eosio-core INTERFACE -fno-exceptions -D__eosio_cdt__)
target_link_libraries(eosio-core INTERFACE
    -L${CMAKE_CURRENT_SOURCE_DIR}/lib-wasm
    -leosio-core
    abieos
    boost
)

add_library(eosio-contract-base INTERFACE)
target_link_libraries(eosio-contract-base INTERFACE eosio-core)
target_include_directories(eosio-contract-base INTERFACE eosiolib/contracts)
target_link_options(eosio-contract-base INTERFACE
    -Wl,--stack-first
    -Wl,--entry,apply
    -Wl,-z,stack-size=8192
    -nostdlib
    -leosio-contract-base
)
string(TOLOWER ${CMAKE_BUILD_TYPE} BUILD_TYPE_LOWER)
if(BUILD_TYPE_LOWER STREQUAL release OR BUILD_TYPE_LOWER STREQUAL minsizerel)
    target_link_options(eosio-contract-base INTERFACE -Wl,--strip-all)
endif()

# Contract with simple malloc/free
add_library(eosio-contract-simple-malloc INTERFACE)
target_link_libraries(eosio-contract-simple-malloc INTERFACE 
    eosio-contract-base
    -lc++
    -lc++abi
    -lc-no-malloc
    simple-malloc
    -leosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

# Contract with full malloc/free
add_library(eosio-contract INTERFACE)
target_link_libraries(eosio-contract INTERFACE 
    eosio-contract-base
    -lc++
    -lc++abi
    -lc
    -leosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

add_library(eden-testlib INTERFACE)
target_link_libraries(eden-testlib INTERFACE
    boost
    eosio-core
    -leden-testlib.a
)
target_include_directories(eden-testlib INTERFACE eosiolib/contracts eosiolib/tester)
target_link_options(eden-testlib INTERFACE -Wl,--export-table)
set_target_properties(eden-testlib PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)
