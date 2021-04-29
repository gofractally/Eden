cmake_minimum_required(VERSION 3.16.3)
cmake_policy(VERSION 3.16)
project(wasm)
enable_testing()

set(IS_WASM YES)
set(ROOT_SOURCE_DIR ${CMAKE_SOURCE_DIR}/..)
set(ROOT_BINARY_DIR ${CMAKE_BINARY_DIR}/..)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

option(FORCE_COLORED_OUTPUT "Always produce ANSI-colored output" TRUE)
if(${FORCE_COLORED_OUTPUT})
    add_compile_options(-fcolor-diagnostics)
endif()

function(native_test N)
endfunction()

function(eden_tester_test N)
    add_test(
        NAME t-${N}
        WORKING_DIRECTORY ${ROOT_BINARY_DIR}
        COMMAND ./eden-tester -v ${N}.wasm
    )
    set_tests_properties(t-${N} PROPERTIES ENVIRONMENT NODE_PATH=dist)
endfunction()

add_subdirectory(../contracts contracts)
add_subdirectory(../libraries libraries)
add_subdirectory(../external external)
add_subdirectory(boost)
add_subdirectory(atomicassets)
