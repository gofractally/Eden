cmake_minimum_required(VERSION 3.16)
project(clsdk)

if(NOT (CMAKE_BUILD_TYPE STREQUAL "Mixed" OR CMAKE_BUILD_TYPE STREQUAL ""))
    # CMAKE_BUILD_TYPE doesn't work well when a single build mixes debug
    # and non-debug targets.
    message(FATAL_ERROR "CMAKE_BUILD_TYPE should be empty or set to \"Mixed\"")
endif()

add_library(wasm-base INTERFACE)
target_compile_options(wasm-base INTERFACE -fno-exceptions -D__eosio_cdt__ -O3)
target_link_options(wasm-base INTERFACE -Wl,--strip-all -O3)

add_library(wasm-base-debug INTERFACE)
target_compile_options(wasm-base-debug INTERFACE -fno-exceptions -D__eosio_cdt__ -ggdb)
target_link_options(wasm-base-debug INTERFACE -ggdb)

add_library(boost INTERFACE)
target_include_directories(boost INTERFACE ${clsdk_DIR}/boost)

function(add_libs suffix)
    add_library(abieos${suffix} INTERFACE)
    target_include_directories(abieos${suffix} INTERFACE
        ${clsdk_DIR}/abieos/include
        ${clsdk_DIR}/rapidjson/include)
    target_link_libraries(abieos${suffix} INTERFACE wasm-base${suffix})
    target_link_libraries(abieos${suffix} INTERFACE
        -L${clsdk_DIR}/lib-wasm
        boost
        -labieos${suffix}
    )

    add_library(simple-malloc${suffix} EXCLUDE_FROM_ALL)
    target_link_libraries(simple-malloc${suffix} PUBLIC wasm-base${suffix})
    target_sources(simple-malloc${suffix} PRIVATE ${clsdk_DIR}/eosiolib/simple_malloc.cpp)
    add_custom_command(
        TARGET simple-malloc${suffix}
        PRE_LINK
        COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc${suffix}.a
        COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc${suffix}.a dlmalloc.o
    )

    add_library(eosio-core${suffix} INTERFACE)
    target_include_directories(eosio-core${suffix} INTERFACE ${clsdk_DIR}/eosiolib/core/include)
    target_link_libraries(eosio-core${suffix} INTERFACE
        -leosio-core${suffix}
        wasm-base${suffix}
        abieos${suffix}
    )

    add_library(eosio-contract-base${suffix} INTERFACE)
    target_link_libraries(eosio-contract-base${suffix} INTERFACE eosio-core${suffix})
    target_include_directories(eosio-contract-base${suffix} INTERFACE
        ${clsdk_DIR}/contracts
        ${clsdk_DIR}/eosiolib/contracts/include
    )
    target_compile_options(eosio-contract-base${suffix} INTERFACE -DCOMPILING_CONTRACT)
    target_link_options(eosio-contract-base${suffix} INTERFACE
        -Wl,--stack-first
        -Wl,--entry,apply
        -Wl,-z,stack-size=8192
        -nostdlib
        -leosio-contract-base${suffix}
    )

    # Contract with simple malloc/free
    add_library(eosio-contract-simple-malloc${suffix} INTERFACE)
    target_link_libraries(eosio-contract-simple-malloc${suffix} INTERFACE 
        -L${CMAKE_CURRENT_BINARY_DIR}
        eosio-contract-base${suffix}
        -lc++
        -lc++abi
        -lc-no-malloc${suffix}
        simple-malloc${suffix}
        -leosio-contracts-wasi-polyfill${suffix}
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )

    # Contract with full malloc/free
    add_library(eosio-contract-full-malloc${suffix} INTERFACE)
    target_link_libraries(eosio-contract-full-malloc${suffix} INTERFACE 
        eosio-contract-base${suffix}
        -lc++
        -lc++abi
        -lc
        -leosio-contracts-wasi-polyfill${suffix}
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )

    add_library(eosio-contract-abigen${suffix} INTERFACE)
    target_compile_options(eosio-contract-abigen${suffix} INTERFACE -DCOMPILING_ABIGEN)
    target_include_directories(eosio-contract-abigen${suffix} INTERFACE
        ${clsdk_DIR}/contracts
        ${clsdk_DIR}/eosiolib/contracts/include
    )
    target_link_libraries(eosio-contract-abigen${suffix} INTERFACE
        eosio-core${suffix}
        -lcltestlib${suffix}
    )

    add_library(cltestlib${suffix} INTERFACE)
    target_link_libraries(cltestlib${suffix} INTERFACE
        eosio-core${suffix}
        -lcltestlib${suffix}
    )
    target_include_directories(cltestlib${suffix} INTERFACE
        ${clsdk_DIR}/catch2/include
        ${clsdk_DIR}/contracts
        ${clsdk_DIR}/eosiolib/contracts/include
        ${clsdk_DIR}/eosiolib/tester/include
    )
    target_compile_options(cltestlib${suffix} INTERFACE
        -DCLSDK_CONTRACTS_DIR=\"${clsdk_DIR}/contracts/\"
        -DCATCH_CONFIG_NO_POSIX_SIGNALS
        -DCATCH_CONFIG_DISABLE_EXCEPTIONS
    )
    target_link_options(cltestlib${suffix} INTERFACE -Wl,--export-table)
endfunction(add_libs)

add_libs("")
add_libs(-debug)
