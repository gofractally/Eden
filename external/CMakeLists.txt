include(ExternalProject)
include(ProcessorCount)

ProcessorCount(NUM_PROCS)

add_library(rapidjson INTERFACE)
target_include_directories(rapidjson INTERFACE rapidjson/include)

if(IS_WASM)
    copy_headers(rapidjson/include/rapidjson rapidjson/include/rapidjson)
    copy_headers(rapidjson/include/rapidjson/error rapidjson/include/rapidjson/error)
    copy_headers(rapidjson/include/rapidjson/internal rapidjson/include/rapidjson/internal)
    configure_file(rapidjson/license.txt ${ROOT_BINARY_DIR}/clsdk/licenses/LICENSE.rapidjson COPYONLY)
endif()

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(FC_SUFFIX _debug)
endif()

if(IS_NATIVE)
    ExternalProject_Add(eos
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/eos
        BINARY_DIR eos
        BUILD_ALWAYS 1
        TEST_EXCLUDE_FROM_MAIN 1
        EXCLUDE_FROM_ALL 1
        BUILD_COMMAND cmake --build . -t eosio_chain -t appbase -t nodeos -t cleos -t keosd -j ${NUM_PROCS}
        INSTALL_COMMAND sh -c "                                             \
            mkdir -p ${ROOT_BINARY_DIR}/eos &&                              \
            mkdir -p ${ROOT_BINARY_DIR}/clsdk/bin &&                        \
            mkdir -p ${ROOT_BINARY_DIR}/clsdk/licenses &&                   \
            cp -p `find . -name '*.a'` ${ROOT_BINARY_DIR}/eos &&            \
            cp -p programs/nodeos/nodeos                                    \
                  programs/cleos/cleos                                      \
                  programs/keosd/keosd                                      \
                  ${ROOT_BINARY_DIR}/clsdk/bin &&                           \
            cp -a                                                           \
                ${CMAKE_CURRENT_BINARY_DIR}/eos/licenses/eosio/LICENSE.*    \
                ${ROOT_BINARY_DIR}/clsdk/licenses"
        CMAKE_ARGS
            -DENABLE_OC=OFF
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_TARGET_MESSAGES=${CMAKE_TARGET_MESSAGES}
            -DCMAKE_INSTALL_PREFIX=${ROOT_BINARY_DIR}/eos
            -DCMAKE_INSTALL_LIBDIR=lib
            -DCMAKE_C_COMPILER_LAUNCHER=${CMAKE_C_COMPILER_LAUNCHER}
            -DCMAKE_CXX_COMPILER_LAUNCHER=${CMAKE_CXX_COMPILER_LAUNCHER}
            -DEOSIO_ADDITIONAL_PLUGINS=${ROOT_SOURCE_DIR}/plugins/debug_plugin
        BUILD_BYPRODUCTS
            ${ROOT_BINARY_DIR}/clsdk/bin/cleos
            ${ROOT_BINARY_DIR}/clsdk/bin/keosd
            ${ROOT_BINARY_DIR}/clsdk/bin/nodeos
            ${CMAKE_BINARY_DIR}/eos/libappbase.a
            ${CMAKE_BINARY_DIR}/eos/libbuiltins.a
            ${CMAKE_BINARY_DIR}/eos/libchainbase.a
            ${CMAKE_BINARY_DIR}/eos/libeosio_chain.a
            ${CMAKE_BINARY_DIR}/eos/libfc${FC_SUFFIX}.a
            ${CMAKE_BINARY_DIR}/eos/libIR.a
            ${CMAKE_BINARY_DIR}/eos/libLogging.a
            ${CMAKE_BINARY_DIR}/eos/libRuntime.a
            ${CMAKE_BINARY_DIR}/eos/libsecp256k1${FC_SUFFIX}.a
            ${CMAKE_BINARY_DIR}/eos/libsoftfloat.a
            ${CMAKE_BINARY_DIR}/eos/libWASM.a
            ${CMAKE_BINARY_DIR}/eos/libWAST.a
    )

    find_package(OpenSSL REQUIRED)
    find_package(Threads REQUIRED)
    find_package(ZLIB REQUIRED)

    set(Boost_USE_MULTITHREADED ON)
    set(Boost_USE_STATIC_LIBS   ON)
    find_package(Boost 1.67 REQUIRED COMPONENTS date_time filesystem chrono iostreams)

    add_library(chain INTERFACE)
    target_include_directories(chain INTERFACE
        ${ROOT_SOURCE_DIR}/external/eos/libraries/appbase/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/builtins
        ${ROOT_SOURCE_DIR}/external/eos/libraries/chain/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/chainbase/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/eos-vm/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/fc/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/softfloat/source/include
        ${ROOT_SOURCE_DIR}/external/eos/libraries/wasm-jit/Include
    )
    target_link_libraries(chain INTERFACE
        -L${ROOT_BINARY_DIR}/eos
        -leosio_chain
        -lRuntime
        -lWASM
        -lIR
        -lLogging
        -lWAST
        -lbuiltins
        -lsoftfloat
        -lchainbase
        -lfc${FC_SUFFIX}
        -lsecp256k1${FC_SUFFIX}
        -lappbase
        Boost::date_time Boost::filesystem Boost::chrono Boost::iostreams Threads::Threads
        ${OPENSSL_LIBRARIES}
        ${ZLIB_LIBRARIES}
        -lgmp
        -lrt
    )
    add_dependencies(chain eos)

    add_library(eos-fc INTERFACE)
    target_include_directories(eos-fc INTERFACE
        ${ROOT_SOURCE_DIR}/external/eos/libraries/fc/include
    )
    target_link_libraries(eos-fc INTERFACE
        -L${ROOT_BINARY_DIR}/eos
        -lfc${FC_SUFFIX}
        -lsecp256k1${FC_SUFFIX}
        Boost::date_time Boost::filesystem Boost::chrono Boost::iostreams Threads::Threads
        ${OPENSSL_LIBRARIES}
        ${ZLIB_LIBRARIES}
        -lgmp
    )
    add_dependencies(eos-fc eos)

    ExternalProject_Add(rocksdb-ext
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/rocksdb
        BINARY_DIR rocksdb-ext
        TEST_EXCLUDE_FROM_MAIN 1
        EXCLUDE_FROM_ALL 1
        CMAKE_ARGS
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_TARGET_MESSAGES=${CMAKE_TARGET_MESSAGES}
            -DCMAKE_INSTALL_PREFIX=${ROOT_BINARY_DIR}/rocksdb
            -DPORTABLE=ON # don't use sse4.2
            -DWITH_GFLAGS=OFF
            -DWITH_TESTS=OFF
            -DWITH_TOOLS=OFF
            -DWITH_BENCHMARK_TOOLS=OFF
            -DFAIL_ON_WARNINGS=OFF
            -DCMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT=OFF
            -DCMAKE_INSTALL_LIBDIR=lib
            -DCMAKE_C_COMPILER_LAUNCHER=${CMAKE_C_COMPILER_LAUNCHER}
            -DCMAKE_CXX_COMPILER_LAUNCHER=${CMAKE_CXX_COMPILER_LAUNCHER}
        BUILD_BYPRODUCTS ${CMAKE_BINARY_DIR}/rocksdb/lib/librocksdb.a
    )
    add_library(rocksdb INTERFACE)
    target_include_directories(rocksdb INTERFACE ${CMAKE_BINARY_DIR}/rocksdb/include)
    target_link_libraries(rocksdb INTERFACE ${CMAKE_BINARY_DIR}/rocksdb/lib/librocksdb.a)
    add_dependencies(rocksdb rocksdb-ext)
endif()

ExternalProject_Add(fmt-ext
    SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/fmt
    BINARY_DIR fmt
    TEST_EXCLUDE_FROM_MAIN 1
    EXCLUDE_FROM_ALL 1
    CMAKE_ARGS
        -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
        -DCMAKE_TARGET_MESSAGES=${CMAKE_TARGET_MESSAGES}
        -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/fmt
        -DCMAKE_INSTALL_LIBDIR=lib
        -DCMAKE_C_COMPILER_LAUNCHER=${CMAKE_C_COMPILER_LAUNCHER}
        -DCMAKE_CXX_COMPILER_LAUNCHER=${CMAKE_CXX_COMPILER_LAUNCHER}
    BUILD_BYPRODUCTS ${CMAKE_BINARY_DIR}/fmt/lib/libfmt.a
)

add_library(fmt INTERFACE)
target_include_directories(fmt INTERFACE ${CMAKE_BINARY_DIR}/fmt/include)
target_link_libraries(fmt INTERFACE ${CMAKE_BINARY_DIR}/fmt/lib/libfmt.a)
add_dependencies(fmt fmt-ext)

if(IS_WASM)
    set(CATCH2_INSTALL_COMMAND
        INSTALL_COMMAND sh -c "                                     \
            cmake --install . &&                                    \
            mkdir -p ${ROOT_BINARY_DIR}/clsdk/catch2 &&             \
            cp -a                                                   \
                ${CMAKE_BINARY_DIR}/catch2/include                  \
                ${ROOT_BINARY_DIR}/clsdk/catch2 &&                  \
            cp                                                      \
                ${CMAKE_CURRENT_SOURCE_DIR}/Catch2/LICENSE.txt      \
                ${ROOT_BINARY_DIR}/clsdk/licenses/LICENSE.catch2"
    )
endif()

ExternalProject_Add(catch2-ext
    SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/Catch2
    BINARY_DIR catch2
    TEST_EXCLUDE_FROM_MAIN 1
    EXCLUDE_FROM_ALL 1
    ${CATCH2_INSTALL_COMMAND}
    CMAKE_ARGS
        -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
        -DCMAKE_TARGET_MESSAGES=${CMAKE_TARGET_MESSAGES}
        -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/catch2
        -DCATCH_INSTALL_DOCS=FALSE
        -DCATCH_INSTALL_EXTRAS=FALSE
        -DCMAKE_C_COMPILER_LAUNCHER=${CMAKE_C_COMPILER_LAUNCHER}
        -DCMAKE_CXX_COMPILER_LAUNCHER=${CMAKE_CXX_COMPILER_LAUNCHER}
)

add_library(catch2 INTERFACE)
target_include_directories(catch2 INTERFACE ${CMAKE_BINARY_DIR}/catch2/include)
add_dependencies(catch2 catch2-ext)

if(IS_WASM)
    target_compile_options(catch2 INTERFACE -DCATCH_CONFIG_NO_POSIX_SIGNALS -DCATCH_CONFIG_DISABLE_EXCEPTIONS)
endif()
