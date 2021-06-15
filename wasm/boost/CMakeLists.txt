set(BOOST_URL https://github.com/eoscommunity/Eden/releases/download/deps/boost_1_75_0.tar.bz2)
set(BOOST_ARCHIVE ${CMAKE_CURRENT_BINARY_DIR}/boost_1_75_0.tar.bz2)
set(BOOST_EXTRACTED ${CMAKE_CURRENT_BINARY_DIR}/boost_1_75_0)
set(BOOST_BOOST ${CMAKE_CURRENT_BINARY_DIR}/boost)

if(NOT EXISTS ${BOOST_ARCHIVE})
    message("Downloading ${BOOST_URL}")
    file(DOWNLOAD ${BOOST_URL} ${BOOST_ARCHIVE}
        STATUS BOOST_DOWNLOAD_STATUS
        TIMEOUT 60
        SHOW_PROGRESS
        TLS_VERIFY ON)
    list(POP_BACK BOOST_DOWNLOAD_STATUS BOOST_DOWNLOAD_STATUS_MSG)
    if(NOT BOOST_DOWNLOAD_STATUS EQUAL 0)
        file(REMOVE ${BOOST_ARCHIVE})
        message(FATAL_ERROR "Download ${BOOST_URL} failed. ${BOOST_DOWNLOAD_STATUS_MSG}")
    endif()
endif()

if(NOT EXISTS ${BOOST_EXTRACTED})
    message("Extracting ${BOOST_ARCHIVE}")
    execute_process(
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMAND tar xf ${BOOST_ARCHIVE}
    )
endif()

if(NOT EXISTS ${BOOST_BOOST})
    message("Copying ${BOOST_BOOST}")
    execute_process(
        WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}
        COMMAND cp -a ${BOOST_EXTRACTED}/boost ${BOOST_BOOST}
    )
endif()

add_library(boost INTERFACE)
target_include_directories(boost INTERFACE ${CMAKE_CURRENT_BINARY_DIR})

file(COPY ${BOOST_BOOST} DESTINATION ${ROOT_BINARY_DIR}/clsdk/boost)
configure_file(${BOOST_EXTRACTED}/LICENSE_1_0.txt ${ROOT_BINARY_DIR}/clsdk/licenses/LICENSE.boost COPYONLY)
