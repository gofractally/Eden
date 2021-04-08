enable_testing()

set(IS_NATIVE YES)
set(ROOT_SOURCE_DIR ${CMAKE_SOURCE_DIR})
set(ROOT_BINARY_DIR ${CMAKE_BINARY_DIR})

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS ON)

function(native_test N)
    add_test(
        NAME n-${N}
        WORKING_DIRECTORY ${ROOT_BINARY_DIR}
        COMMAND ./${N}
    )
endfunction()

function(wasm_test N)
endfunction()

function(native_and_wasm_test N)
    native_test(${N})
endfunction()

add_subdirectory(../external external)
add_subdirectory(../libraries libraries)
add_subdirectory(../programs programs)
