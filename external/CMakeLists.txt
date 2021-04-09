add_library(rapidjson INTERFACE)
target_include_directories(rapidjson INTERFACE rapidjson/include)

if(IS_NATIVE)
    ExternalProject_Add(eos
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/eos
        BINARY_DIR eos
        BUILD_ALWAYS 1
        TEST_EXCLUDE_FROM_MAIN 1
        EXCLUDE_FROM_ALL 1
        BUILD_COMMAND cmake --build . -t eosio_chain
        INSTALL_COMMAND sh -c "mkdir -p ${ROOT_BINARY_DIR}/eos && cp -p `find . -name *.a` ${ROOT_BINARY_DIR}/eos"
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

    add_library(chain INTERFACE)
    target_include_directories(chain INTERFACE
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
        -lfc
        -lsecp256k1
        Boost::date_time Boost::filesystem Boost::chrono Boost::iostreams Threads::Threads
        ${OPENSSL_LIBRARIES}
        ${ZLIB_LIBRARIES}
        -lgmp
        -lrt
    )
endif()
