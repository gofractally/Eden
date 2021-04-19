enable_testing()

set(IS_NATIVE YES)
set(ROOT_SOURCE_DIR ${CMAKE_SOURCE_DIR})
set(ROOT_BINARY_DIR ${CMAKE_BINARY_DIR})

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS ON)

option(FORCE_COLORED_OUTPUT "Always produce colored output" TRUE)
if(${FORCE_COLORED_OUTPUT})
    if("${CMAKE_CXX_COMPILER_ID}" STREQUAL "GNU")
       add_compile_options(-fdiagnostics-color=always)
    elseif("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang")
       add_compile_options(-fcolor-diagnostics)
    endif()
endif()

function(native_test N)
    add_test(
        NAME n-${N}
        WORKING_DIRECTORY ${ROOT_BINARY_DIR}
        COMMAND ./${N}
    )
endfunction()

add_subdirectory(../external external)
add_subdirectory(../libraries libraries)
add_subdirectory(../programs programs)
