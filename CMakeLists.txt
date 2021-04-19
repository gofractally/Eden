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
    if(NOT DEFINED TOKEN_SYMBOL AND NOT DEFINED ENV{TOKEN_SYMBOL})
        set(TOKEN_SYMBOL "WAX")
    elseif(NOT DEFINED TOKEN_SYMBOL AND DEFINED ENV{TOKEN_SYMBOL})
        set(TOKEN_SYMBOL $ENV{TOKEN_SYMBOL})
    endif()
    message(STATUS "Using TOKEN_SYMBOL ${TOKEN_SYMBOL}")

    if(NOT DEFINED TOKEN_PRECISION AND NOT DEFINED ENV{TOKEN_PRECISION})
        set(TOKEN_PRECISION 8)
    elseif(NOT DEFINED TOKEN_PRECISION AND DEFINED ENV{TOKEN_PRECISION})
        set(TOKEN_PRECISION $ENV{TOKEN_PRECISION})
    endif()
    message(STATUS "Using TOKEN_PRECISION ${TOKEN_PRECISION}")

    if(NOT DEFINED TOKEN_MINIMUM_DONATION AND NOT DEFINED ENV{TOKEN_PRECISION})
        set(TOKEN_MINIMUM_DONATION 1000000000)
    elseif(NOT DEFINED TOKEN_MINIMUM_DONATION AND DEFINED ENV{TOKEN_MINIMUM_DONATION})
        set(TOKEN_MINIMUM_DONATION $ENV{TOKEN_MINIMUM_DONATION})
    endif()
    message(STATUS "Using TOKEN_MINIMUM_DONATION ${TOKEN_MINIMUM_DONATION}")

    ExternalProject_Add(wasm
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/wasm
        BINARY_DIR wasm
        INSTALL_COMMAND ""
        BUILD_ALWAYS 1
        TEST_EXCLUDE_FROM_MAIN 1
        CMAKE_ARGS
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_TOOLCHAIN_FILE=${CMAKE_CURRENT_SOURCE_DIR}/wasm/toolchain.cmake
            -DWASI_SDK_PREFIX=${WASI_SDK_PREFIX}
            -DTOKEN_SYMBOL=${TOKEN_SYMBOL}
            -DTOKEN_PRECISION=${TOKEN_PRECISION}
            -DTOKEN_MINIMUM_DONATION=${TOKEN_MINIMUM_DONATION}
            -DCMAKE_SYSROOT=${WASI_SDK_PREFIX}/share/wasi-sysroot
            -DFORCE_COLORED_OUTPUT=${FORCE_COLORED_OUTPUT}
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
