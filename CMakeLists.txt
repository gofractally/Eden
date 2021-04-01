cmake_minimum_required(VERSION 3.16.3)
project(eden)
include(ExternalProject)

if(CMAKE_BINARY_DIR STREQUAL CMAKE_CURRENT_SOURCE_DIR)
    message(FATAL_ERROR "Building in-source is not supported; create a build dir and remove ${CMAKE_SOURCE_DIR}/CMakeCache.txt and ${CMAKE_SOURCE_DIR}/CMakeFiles")
endif()

file(WRITE ${CMAKE_BINARY_DIR}/CTestTestfile.cmake)

if(DEFINED EOSIO_CONTRACTS OR EOSIO_CONTRACTS)
    message(STATUS "Building eosio contracts")

    find_package(eosio.cdt)
    set(EOSIO_CDT_VERSION_MIN "1.7")
    set(EOSIO_CDT_VERSION_SOFT_MAX "1.7")
    set(EOSIO_CDT_VERSION_HARD_MAX "")

    ### Check the version of eosio.cdt
    set(VERSION_MATCH_ERROR_MSG "eosio.cdt version incorrect version, we expect 1.7")
    EOSIO_CHECK_VERSION(VERSION_OUTPUT "${EOSIO_CDT_VERSION}"
                                       "${EOSIO_CDT_VERSION_MIN}"
                                       "${EOSIO_CDT_VERSION_SOFT_MAX}"
                                       "${EOSIO_CDT_VERSION_HARD_MAX}"
                                       VERSION_MATCH_ERROR_MSG)

    ExternalProject_Add(contracts
        SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/contracts
        BINARY_DIR ${CMAKE_BINARY_DIR}/contracts
        CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${EOSIO_CDT_ROOT}/lib/cmake/eosio.cdt/EosioWasmToolchain.cmake
        UPDATE_COMMAND ""
        PATCH_COMMAND ""
        TEST_COMMAND ""
        INSTALL_COMMAND ""
        BUILD_ALWAYS 1
    )
else()
    message(WARNING "EOSIO_CONTRACTS isn't defined; skipping eosio build")
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
