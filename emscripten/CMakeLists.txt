cmake_minimum_required(VERSION 3.16.3)
cmake_policy(VERSION 3.16)
project(emscripten)

set(IS_EMSCRIPTEN YES)
get_filename_component(ROOT_SOURCE_DIR ${CMAKE_SOURCE_DIR}/.. ABSOLUTE)
get_filename_component(ROOT_BINARY_DIR ${CMAKE_BINARY_DIR}/.. ABSOLUTE)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(FORCE_COLORED_OUTPUT "Always produce ANSI-colored output" TRUE)
if(${FORCE_COLORED_OUTPUT})
    add_compile_options(-fcolor-diagnostics)
endif()

set(DEP_PREFIX ${CMAKE_BINARY_DIR}/deps)

set(DEP_URL https://github.com/eoscommunity/Eden/releases/download/deps)
set(GMP_ARCHIVE gmp-6.2.1.tar.zst)
set(GMP_EXTRACTED gmp-6.2.1)
set(OPENSSL_ARCHIVE openssl-1.1.1k.tar.gz)
set(OPENSSL_EXTRACTED openssl-1.1.1k)
set(ZLIB_ARCHIVE zlib-1.2.11.tar.gz)
set(ZLIB_EXTRACTED zlib-1.2.11)

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

# Dependancy builds are done at generation time so cmake's find_* commands can find them

if(NOT EXISTS ${DEP_PREFIX}/lib/libz.a)
    download(${DEP_URL}/${ZLIB_ARCHIVE} ${DEP_PREFIX}/${ZLIB_ARCHIVE})
    message("building zlib")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${ZLIB_EXTRACTED}                                     \
            && tar xf ${ZLIB_ARCHIVE}                                       \
            && cd ${ZLIB_EXTRACTED}                                         \
            && emconfigure ./configure --prefix=${DEP_PREFIX} --static      \
            && emmake make -j                                               \
            && emmake make -j install                                       \
        "
    )
endif()

if(NOT EXISTS ${DEP_PREFIX}/lib/libgmp.so)
    download(${DEP_URL}/${GMP_ARCHIVE} ${DEP_PREFIX}/${GMP_ARCHIVE})
    message("building gmp")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${GMP_EXTRACTED}                                                         \
            && tar xf ${GMP_ARCHIVE}                                                           \
            && cd ${GMP_EXTRACTED}                                                             \
            && emconfigure ./configure --prefix=${DEP_PREFIX} --host none --disable-assembly   \
            && emmake make -j                                                                  \
            && emmake make -j install                                                          \
            && ln -sf libgmp.a ../lib/libgmp.so                                                \
        "
    )
endif()

if(NOT EXISTS ${DEP_PREFIX}/lib/libssl.a)
    download(${DEP_URL}/${OPENSSL_ARCHIVE} ${DEP_PREFIX}/${OPENSSL_ARCHIVE})
    message("building openssl")
    execute_process(
        WORKING_DIRECTORY ${DEP_PREFIX}
        COMMAND bash -c "\
               rm -rf ${OPENSSL_EXTRACTED}                                                          \
            && tar xf ${OPENSSL_ARCHIVE}                                                            \
            && cd ${OPENSSL_EXTRACTED}                                                              \
            && emconfigure bash -c                                                                  \
               \"CROSS_COMPILE= ./config --prefix=${DEP_PREFIX} no-asm no-afalgeng no-shared\"      \
            && make -j build_libs                                                                   \
            && make install_dev                                                                     \
        "
    )
endif()

if(NOT EXISTS ${DEP_PREFIX}/include/boost)
    message("building boost")
    execute_process(
        WORKING_DIRECTORY ${BOOST_EXTRACTED}
        COMMAND bash -c "\
            ZLIB_LIBRARY_PATH=${DEP_PREFIX}/lib     \
            ZLIB_INCLUDE=${DEP_PREFIX}/include      \
            ./b2                                    \
            --prefix=${DEP_PREFIX}                  \
            --build-dir=${DEP_PREFIX}/build-boost   \
            toolset=emscripten                      \
            variant=release                         \
            runtime-link=static                     \
            link=static                             \
            --with-chrono                           \
            --with-date_time                        \
            --with-filesystem                       \
            --with-iostreams                        \
            --with-program_options                  \
            --with-system                           \
            --with-test                             \
            install                                 \
        "
    )
endif()

set(Boost_USE_STATIC_RUNTIME ON)
set(ECC_IMPL secp256k1)
set(SKIP_FC_TESTS YES)
option(ENABLE_TOOLS "enable building of tools" OFF)
set(EOSIO_ROOT_KEY "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV")

add_compile_options(-fexceptions -pthread)
add_link_options(-fexceptions -pthread)

add_subdirectory(../external/eos/libraries/builtins builtins)
add_subdirectory(../external/eos/libraries/chain chain)
add_subdirectory(../external/eos/libraries/chainbase chainbase)
add_subdirectory(../external/eos/libraries/eos-vm eos-vm)
add_subdirectory(../external/eos/libraries/fc fc)
add_subdirectory(../external/eos/libraries/version version)
add_subdirectory(../external/eos/libraries/wasm-jit wasm-jit)
add_subdirectory(../libraries/cltestlib cltestlib)

add_library(chain INTERFACE)
target_link_libraries(chain INTERFACE eosio_chain)

add_executable(t test.cpp)
target_link_options(t PRIVATE -L${DEP_PREFIX}/lib)
target_link_libraries(t cltestlib)
target_link_options(t PRIVATE
    -gsource-map
    --source-map-base ./
    #--pre-js ${CMAKE_CURRENT_SOURCE_DIR}/test-pre.js
    -flto
    --embind
    -sMODULARIZE=1
    -sEXPORT_NAME="createCLTester"
    -sDISABLE_EXCEPTION_CATCHING=0
    -sEXIT_RUNTIME=0
    -sALLOW_MEMORY_GROWTH=1
    -sDEMANGLE_SUPPORT=1
    #-sPROXY_TO_PTHREAD=1
    -sSTACK_OVERFLOW_CHECK=0
    #-sASSERTIONS=1
    -Wno-pthreads-mem-growth
)
#set_target_properties(t PROPERTIES SUFFIX .html)
