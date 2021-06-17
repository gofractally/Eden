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

# Dependancy builds are done generation time so cmake's find_* commands can find them
if(NOT EXISTS ${DEP_PREFIX}/include/boost)
    message("building boost")
    execute_process(
        WORKING_DIRECTORY ${BOOST_EXTRACTED}
        COMMAND ./b2 --prefix=${DEP_PREFIX} --build-dir=${DEP_PREFIX}/build-boost toolset=emscripten variant=release runtime-link=static link=static --with-chrono --with-date_time --with-filesystem --with-iostreams --with-program_options --with-system --with-test install
    )
endif()
