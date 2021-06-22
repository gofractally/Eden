set(BOOST_BOOST ${CMAKE_CURRENT_BINARY_DIR}/boost)

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
