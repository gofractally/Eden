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
            -DCMAKE_BUILD_TYPE=${CMAKE_BUILD_TYPE}
            -DCMAKE_INSTALL_PREFIX=${ROOT_BINARY_DIR}/eos
    )
endif()
