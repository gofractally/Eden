cmake_minimum_required(VERSION 3.16.3)
project(eden)
include(ExternalProject)

if(CMAKE_BINARY_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    message(FATAL_ERROR "Building in-source is not supported; create a build dir and remove ${CMAKE_SOURCE_DIR}/CMakeCache.txt and ${CMAKE_SOURCE_DIR}/CMakeFiles")
endif()

if(NOT DEFINED WASI_SDK_PREFIX AND DEFINED ENV{WASI_SDK_PREFIX})
    set(WASI_SDK_PREFIX $ENV{WASI_SDK_PREFIX})
endif()

file(WRITE ${CMAKE_BINARY_DIR}/CTestTestfile.cmake)

option(BUILD_NATIVE "Build native code" ON)
if(BUILD_NATIVE)
    add_subdirectory(native)
    file(APPEND ${CMAKE_BINARY_DIR}/CTestTestfile.cmake "subdirs(\"native\")\n")
endif()

if(DEFINED WASI_SDK_PREFIX)
    set(EDEN_ATOMIC_ASSETS_ACCOUNT atomicassets CACHE STRING "The account holding the atomicassets contract")
    set(EDEN_ATOMIC_MARKET_ACCOUNT atomicmarket CACHE STRING "The account holding the atomicmarket contract")
    set(EDEN_SCHEMA_NAME members CACHE STRING "The atomicassets schema to use for NFTS")

    ExternalProject_Add(wasm
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/wasm
        DEPENDS cltester # for abi generation
        BINARY_DIR wasm
        INSTALL_COMMAND ""
        BUILD_ALWAYS 1
        TEST_EXCLUDE_FROM_MAIN 1
        CMAKE_ARGS
            -DCMAKE_BUILD_TYPE=
            -DCMAKE_TOOLCHAIN_FILE=${CMAKE_CURRENT_SOURCE_DIR}/wasm/toolchain.cmake
            -DWASI_SDK_PREFIX=${WASI_SDK_PREFIX}
            -DWASM_CLANG_PREFIX=${WASM_CLANG_PREFIX}
            -DWASM_CLANG_SUFFIX=${WASM_CLANG_SUFFIX}
            -DEDEN_ATOMIC_ASSETS_ACCOUNT=${EDEN_ATOMIC_ASSETS_ACCOUNT}
            -DEDEN_ATOMIC_MARKET_ACCOUNT=${EDEN_ATOMIC_MARKET_ACCOUNT}
            -DEDEN_SCHEMA_NAME=${EDEN_SCHEMA_NAME}
            -DCMAKE_SYSROOT=${WASI_SDK_PREFIX}/share/wasi-sysroot
            -DFORCE_COLORED_OUTPUT=${FORCE_COLORED_OUTPUT}
            -DCMAKE_C_COMPILER_LAUNCHER=${CMAKE_C_COMPILER_LAUNCHER}
            -DCMAKE_CXX_COMPILER_LAUNCHER=${CMAKE_CXX_COMPILER_LAUNCHER}
            -DCMAKE_FIND_ROOT_PATH=${CMAKE_CURRENT_BINARY_DIR}/wasm/deps
            -DCMAKE_PREFIX_PATH=/
    )
    file(APPEND ${CMAKE_BINARY_DIR}/CTestTestfile.cmake "subdirs(\"wasm\")\n")
    ExternalProject_Add_StepTargets(wasm test)
else()
    message(WARNING "WASI_SDK_PREFIX isn't defined; skipping wasm")
endif()

########## TS PACKAGES ####################
if(NOT DEFINED SKIP_TS OR NOT SKIP_TS)
    add_custom_target(yarn ALL
        COMMAND yarn
        COMMAND yarn build
    )

    add_custom_target(packages ALL
        DEPENDS yarn
        COMMAND rm -rf ${CMAKE_BINARY_DIR}/dist

        COMMAND mkdir -p ${CMAKE_BINARY_DIR}/dist/webapp
        COMMAND cp -a ${CMAKE_CURRENT_SOURCE_DIR}/packages/webapp/dist/* ${CMAKE_BINARY_DIR}/dist/webapp
    )

    add_custom_target(dev
        DEPENDS yarn
        COMMAND yarn dev --stream
    )
endif()
