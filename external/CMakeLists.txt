include(ExternalProject)
include(ProcessorCount)

ProcessorCount(NUM_PROCS)

add_library(rapidjson INTERFACE)
target_include_directories(rapidjson INTERFACE rapidjson/include)

if(IS_NATIVE)
    ExternalProject_Add(eos
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/eos
        BINARY_DIR eos
        BUILD_ALWAYS 1
        TEST_EXCLUDE_FROM_MAIN 1
        EXCLUDE_FROM_ALL 1
        BUILD_COMMAND cmake --build . -t eosio_chain -j ${NUM_PROCS}
        INSTALL_COMMAND sh -c "mkdir -p ${ROOT_BINARY_DIR}/eos && cp -p `find . -name '*.a'` ${ROOT_BINARY_DIR}/eos"
        CMAKE_ARGS
            -DENABLE_OC=OFF
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_INSTALL_PREFIX=${ROOT_BINARY_DIR}/eos
    )

    find_package(OpenSSL REQUIRED)
    find_package(Threads REQUIRED)
    find_package(ZLIB REQUIRED)

    set(Boost_USE_MULTITHREADED ON)
    set(Boost_USE_STATIC_LIBS   ON)
    find_package(Boost 1.67 REQUIRED COMPONENTS date_time filesystem chrono iostreams)

    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        set(FC_SUFFIX _debug)
    endif()

    add_library(chain INTERFACE)
    target_include_directories(chain INTERFACE
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
    )
    add_dependencies(eos-fc eos)

    ExternalProject_Add(rocksdb-ext
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/rocksdb
        BINARY_DIR rocksdb-ext
        TEST_EXCLUDE_FROM_MAIN 1
        EXCLUDE_FROM_ALL 1
        CMAKE_ARGS
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_INSTALL_PREFIX=${ROOT_BINARY_DIR}/rocksdb
            -DPORTABLE=ON # don't use sse4.2
            -DWITH_GFLAGS=OFF
            -DWITH_TESTS=OFF
            -DWITH_TOOLS=OFF
            -DWITH_BENCHMARK_TOOLS=OFF
            -DFAIL_ON_WARNINGS=OFF
            -DCMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT=OFF
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
        -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/fmt
        -DCMAKE_INSTALL_LIBDIR=lib
    BUILD_BYPRODUCTS ${CMAKE_BINARY_DIR}/fmt/lib/libfmt.a
)

add_library(fmt INTERFACE)
target_include_directories(fmt INTERFACE ${CMAKE_BINARY_DIR}/fmt/include)
target_link_libraries(fmt INTERFACE ${CMAKE_BINARY_DIR}/fmt/lib/libfmt.a)
add_dependencies(fmt fmt-ext)

ExternalProject_Add(catch2-ext
    SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/Catch2
    BINARY_DIR catch2
    TEST_EXCLUDE_FROM_MAIN 1
    EXCLUDE_FROM_ALL 1
    CMAKE_ARGS
        -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
        -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/catch2
        -DCATCH_INSTALL_DOCS=FALSE
        -DCATCH_INSTALL_EXTRAS=FALSE
)

add_library(catch2 INTERFACE)
target_include_directories(catch2 INTERFACE ${CMAKE_BINARY_DIR}/catch2/include)
add_dependencies(catch2 catch2-ext)

if(IS_WASM)
    target_compile_options(catch2 INTERFACE -DCATCH_CONFIG_NO_POSIX_SIGNALS -DCATCH_CONFIG_DISABLE_EXCEPTIONS)
endif()
