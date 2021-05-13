cmake_minimum_required(VERSION 3.16)
project(clsdk)

if(CMAKE_BUILD_TYPE STREQUAL "")
    # Empty CMAKE_BUILD_TYPE causes contracts to exceed eosio wasm limits.
    # Debug builds also exceed those limits, but in that case the user made
    # an explicit request.
    message(FATAL_ERROR "CMAKE_BUILD_TYPE is not set. Try -DCMAKE_BUILD_TYPE=Release")
endif()

add_library(boost INTERFACE)
target_include_directories(boost INTERFACE ${clsdk_DIR}/boost)

add_library(abieos INTERFACE)
target_include_directories(abieos INTERFACE
    ${clsdk_DIR}/abieos/include
    ${clsdk_DIR}/rapidjson/include)
target_link_libraries(abieos INTERFACE
    -L${clsdk_DIR}/lib-wasm
    boost
    -labieos
)

add_library(simple-malloc EXCLUDE_FROM_ALL)
target_compile_options(simple-malloc PRIVATE -fno-exceptions -D__eosio_cdt__)
target_sources(simple-malloc PRIVATE ${clsdk_DIR}/eosiolib/simple_malloc.cpp)
add_custom_command(
    TARGET simple-malloc
    PRE_LINK
    COMMAND cp ${WASI_SDK_PREFIX}/share/wasi-sysroot/lib/wasm32-wasi/libc.a libc-no-malloc.a
    COMMAND ${WASI_SDK_PREFIX}/bin/llvm-ar d libc-no-malloc.a dlmalloc.o
)

add_library(eosio-core INTERFACE)
target_include_directories(eosio-core INTERFACE ${clsdk_DIR}/eosiolib/core/include)
target_compile_options(eosio-core INTERFACE -fno-exceptions -D__eosio_cdt__)
target_link_libraries(eosio-core INTERFACE
    -leosio-core
    abieos
)

add_library(eosio-contract-base INTERFACE)
target_link_libraries(eosio-contract-base INTERFACE eosio-core)
target_include_directories(eosio-contract-base INTERFACE
    ${clsdk_DIR}/contracts
    ${clsdk_DIR}/eosiolib/contracts/include
)
target_compile_options(eosio-contract-base INTERFACE -DCOMPILING_CONTRACT)
target_link_options(eosio-contract-base INTERFACE
    -Wl,--stack-first
    -Wl,--entry,apply
    -Wl,-z,stack-size=8192
    $<$<OR:$<CONFIG:Release>,$<CONFIG:MinSizeRel>>:-Wl,--strip-all>
    -nostdlib
    -leosio-contract-base
)

# Contract with simple malloc/free
add_library(eosio-contract-simple-malloc INTERFACE)
target_link_libraries(eosio-contract-simple-malloc INTERFACE 
    -L${CMAKE_CURRENT_BINARY_DIR}
    eosio-contract-base
    -lc++
    -lc++abi
    -lc-no-malloc
    simple-malloc
    -leosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

# Contract with full malloc/free
add_library(eosio-contract-full-malloc INTERFACE)
target_link_libraries(eosio-contract-full-malloc INTERFACE 
    eosio-contract-base
    -lc++
    -lc++abi
    -lc
    -leosio-contracts-wasi-polyfill
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

add_library(eosio-contract-abigen INTERFACE)
target_compile_options(eosio-contract-abigen INTERFACE -DCOMPILING_ABIGEN)
target_include_directories(eosio-contract-abigen INTERFACE
    ${clsdk_DIR}/contracts
    ${clsdk_DIR}/eosiolib/contracts/include
)
target_link_libraries(eosio-contract-abigen INTERFACE
    eosio-core
    -lcltestlib
)

add_library(cltestlib INTERFACE)
target_link_libraries(cltestlib INTERFACE
    eosio-core
    -lcltestlib
)
target_include_directories(cltestlib INTERFACE
    ${clsdk_DIR}/catch2/include
    ${clsdk_DIR}/contracts
    ${clsdk_DIR}/eosiolib/contracts/include
    ${clsdk_DIR}/eosiolib/tester/include
)
target_compile_options(cltestlib INTERFACE
    -DCLSDK_CONTRACTS_DIR=\"${clsdk_DIR}/contracts/\"
    -DCATCH_CONFIG_NO_POSIX_SIGNALS
    -DCATCH_CONFIG_DISABLE_EXCEPTIONS
)
target_link_options(cltestlib INTERFACE -Wl,--export-table)
