cmake_minimum_required(VERSION 3.16.3)
cmake_policy(VERSION 3.16)
project(wasm)
enable_testing()

set(IS_WASM YES)
get_filename_component(ROOT_SOURCE_DIR ${CMAKE_SOURCE_DIR}/.. ABSOLUTE)
get_filename_component(ROOT_BINARY_DIR ${CMAKE_BINARY_DIR}/.. ABSOLUTE)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(FORCE_COLORED_OUTPUT "Always produce ANSI-colored output" TRUE)
if(${FORCE_COLORED_OUTPUT})
    add_compile_options(-fcolor-diagnostics)
endif()

function(native_test N)
endfunction()

function(eden_tester_test N)
    add_test(
        NAME t-${N}
        WORKING_DIRECTORY ${ROOT_BINARY_DIR}
        COMMAND ./cltester -v ${N}.wasm -s
    )
    set_tests_properties(t-${N} PROPERTIES ENVIRONMENT NODE_PATH=dist)
endfunction()

function(copy_headers from to)
    file(GLOB foo
        ${CMAKE_CURRENT_SOURCE_DIR}/${from}/*.h
        ${CMAKE_CURRENT_SOURCE_DIR}/${from}/*.hpp
    )
    file(COPY ${foo} DESTINATION ${ROOT_BINARY_DIR}/clsdk/${to})
endfunction()

file(COPY ${ROOT_SOURCE_DIR}/LICENSE DESTINATION ${ROOT_BINARY_DIR}/clsdk/licenses)

add_library(wasm-base INTERFACE)
target_compile_options(wasm-base INTERFACE -fno-exceptions -D__eosio_cdt__ -mthread-model single -O3)
target_link_options(wasm-base INTERFACE -Wl,--strip-all -O3)

add_library(wasm-base-debug INTERFACE)
target_compile_options(wasm-base-debug INTERFACE -fno-exceptions -D__eosio_cdt__ -mthread-model single -ggdb)
target_link_options(wasm-base-debug INTERFACE -ggdb)

# -clsdk variant of build targets need paths converted
function(add_clsdk_base_lib suffix)
    add_library(wasm-base${suffix}-clsdk INTERFACE)
    target_link_libraries(wasm-base${suffix}-clsdk INTERFACE wasm-base${suffix})
    target_compile_options(wasm-base${suffix}-clsdk INTERFACE
            -ffile-prefix-map=${ROOT_BINARY_DIR}/wasm/boost/=clsdk:/boost/
            -ffile-prefix-map=${ROOT_BINARY_DIR}/wasm/catch2/=clsdk:/catch2/
            -ffile-prefix-map=${ROOT_SOURCE_DIR}/contracts/=clsdk:/contracts/
            -ffile-prefix-map=${ROOT_SOURCE_DIR}/external/=clsdk:/
            -ffile-prefix-map=${ROOT_SOURCE_DIR}/libraries/=clsdk:/
            -ffile-prefix-map=${WASI_SDK_PREFIX}/=clsdk-wasi-sdk:/
    )
endfunction()
add_clsdk_base_lib("")
add_clsdk_base_lib("-debug")

set(DEP_URL https://github.com/eoscommunity/Eden/releases/download/deps)
set(GMP_ARCHIVE gmp-6.2.1.tar.zst)
set(GMP_EXTRACTED gmp-6.2.1)
set(OPENSSL_ARCHIVE openssl-1.1.1k.tar.gz)
set(OPENSSL_EXTRACTED openssl-1.1.1k)
set(ZLIB_ARCHIVE zlib-1.2.11.tar.gz)
set(ZLIB_EXTRACTED zlib-1.2.11)
set(DEP_PREFIX ${CMAKE_BINARY_DIR}/deps)

function(download url archive)
    if(NOT EXISTS ${archive})
        message("Downloading ${url}")
        file(DOWNLOAD ${url} ${archive}
            STATUS download_status
            TIMEOUT 60
            SHOW_PROGRESS
            TLS_VERIFY ON)
        list(POP_BACK download_status BOOST_DOWNLOAD_STATUS_MSG)
        if(NOT download_status EQUAL 0)
            file(REMOVE ${archive})
            message(FATAL_ERROR "Download ${url} failed. ${BOOST_DOWNLOAD_STATUS_MSG}")
        endif()
    endif()
endfunction()

# These builds are done at generation time so cmake's find_* commands can find them

if(NOT EXISTS ${DEP_PREFIX}/lib/libz.a)
    download(${DEP_URL}/${ZLIB_ARCHIVE} ${DEP_PREFIX}/${ZLIB_ARCHIVE})
    message("building zlib")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${ZLIB_EXTRACTED}                                             \
            && tar xf ${ZLIB_ARCHIVE}                                               \
            && cd ${ZLIB_EXTRACTED}                                                 \
            && export CC=\"${CMAKE_C_COMPILER_LAUNCHER} ${CMAKE_C_COMPILER}\"       \
            && export CXX=\"${CMAKE_CXX_COMPILER_LAUNCHER} ${CMAKE_CXX_COMPILER}\"  \
            && export AR=${CMAKE_AR}                                                \
            && export RANLIB=${CMAKE_RANLIB}                                        \
            && export CFLAGS=\"--sysroot=${CMAKE_SYSROOT}\"                         \
            && ./configure --prefix=${DEP_PREFIX} --static                          \
            && make -j                                                              \
            && make -j install                                                      \
        "
    )
endif()

if(NOT EXISTS ${DEP_PREFIX}/lib/libgmp.a)
    download(${DEP_URL}/${GMP_ARCHIVE} ${DEP_PREFIX}/${GMP_ARCHIVE})
    message("building gmp")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${GMP_EXTRACTED}                                                      \
            && tar xf ${GMP_ARCHIVE}                                                        \
            && cd ${GMP_EXTRACTED}                                                          \
            && ./configure                                                                  \
                CC=\"${CMAKE_C_COMPILER_LAUNCHER} ${CMAKE_C_COMPILER}\"                     \
                CFLAGS=\"--sysroot=${CMAKE_SYSROOT} -D_WASI_EMULATED_SIGNAL\"               \
                LDFLAGS=-lwasi-emulated-signal                                              \
                --prefix=${DEP_PREFIX}                                                      \
                --host none                                                                 \
                --disable-assembly   \                                                      \
            && make -j                                                                      \
            && make -j install                                                              \
        "
    )
endif()

if(NOT EXISTS ${DEP_PREFIX}/lib/libssl.a)
    download(${DEP_URL}/${OPENSSL_ARCHIVE} ${DEP_PREFIX}/${OPENSSL_ARCHIVE})
    message("building openssl")
    set(OPENSSL_BUILD_FLAGS "--sysroot=${CMAKE_SYSROOT} -D_WASI_EMULATED_SIGNAL -DNO_SYSLOG -DOPENSSL_NO_SECURE_MEMORY")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${OPENSSL_EXTRACTED}                                                  \
            && tar xf ${OPENSSL_ARCHIVE}                                                    \
            && cd ${OPENSSL_EXTRACTED}                                                      \
            && ./Configure linux-generic32                                                  \
                --prefix=${DEP_PREFIX}                                                      \
                no-afalgeng no-asm no-dso no-shared no-sock no-tests no-threads no-ui       \
                CC=\"${CMAKE_C_COMPILER_LAUNCHER} ${CMAKE_C_COMPILER}\"                     \
                CXX=\"${CMAKE_CXX_COMPILER_LAUNCHER} ${CMAKE_CXX_COMPILER}\"                \
                AR=${CMAKE_AR}                                                              \
                RANLIB=${CMAKE_RANLIB}                                                      \
                CFLAGS=\"${OPENSSL_BUILD_FLAGS}\"                                           \
                CXXFLAGS=\"${OPENSSL_BUILD_FLAGS}\"                                         \
            && make -j install_dev install_engines                                          \
        "
    )
endif()

add_subdirectory(../contracts contracts)
add_subdirectory(../external external)
add_subdirectory(../libraries libraries)
add_subdirectory(../programs programs)
add_subdirectory(boost)
add_subdirectory(atomicassets)
add_subdirectory(atomicmarket)
