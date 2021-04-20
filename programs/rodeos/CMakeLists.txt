if(EXISTS ${ROOT_SOURCE_DIR}/.git)
    find_package(Git)
    if(GIT_FOUND)
        execute_process(
            COMMAND ${GIT_EXECUTABLE} rev-parse --short=8 HEAD
            WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../.."
            OUTPUT_VARIABLE "rodeos_BUILD_VERSION"
            ERROR_QUIET
            OUTPUT_STRIP_TRAILING_WHITESPACE)
        message(STATUS "Git commit revision: ${rodeos_BUILD_VERSION}")
    else()
       set(rodeos_BUILD_VERSION 0)
    endif()
else()
    set(rodeos_BUILD_VERSION 0)
endif()
configure_file(config.hpp.in config.hpp ESCAPE_QUOTES)

find_package(Boost 1.71 REQUIRED COMPONENTS program_options)

add_executable(rodeos
    cloner_plugin.cpp
    main.cpp
    rocksdb_plugin.cpp
    wasm_ql_http.cpp
    wasm_ql_plugin.cpp
)
target_include_directories(rodeos PRIVATE ${CMAKE_CURRENT_BINARY_DIR})
target_link_libraries(rodeos rodeos_lib Boost::program_options)
set_target_properties(rodeos PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
