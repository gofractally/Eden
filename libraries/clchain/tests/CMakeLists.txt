enable_testing()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

file(GLOB UNIT_TESTS "*.cpp")
add_executable(clchain-tests ${UNIT_TESTS})
target_link_libraries(clchain-tests clchain catch2)
set_target_properties(clchain-tests PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})

native_test(clchain-tests)
