cmake_minimum_required(VERSION 3.16.3)
cmake_policy(VERSION 3.16)
project(emscripten)
enable_testing()

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

download(${DEP_URL}/${GMP_ARCHIVE} ${DEP_PREFIX}/${GMP_ARCHIVE})
download(${DEP_URL}/${OPENSSL_ARCHIVE} ${DEP_PREFIX}/${OPENSSL_ARCHIVE})

# Dependancy builds are done at generation time so cmake's find_* commands can find them
if(NOT EXISTS ${DEP_PREFIX}/lib/libgmp.so)
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

add_subdirectory(../external/eos/libraries/builtins builtins)
add_subdirectory(../external/eos/libraries/chain chain)
add_subdirectory(../external/eos/libraries/chainbase chainbase)
add_subdirectory(../external/eos/libraries/eos-vm eos-vm)
add_subdirectory(../external/eos/libraries/fc fc)
add_subdirectory(../external/eos/libraries/version version)
