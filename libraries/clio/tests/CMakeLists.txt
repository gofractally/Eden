enable_testing()

add_executable(test-clio
    clio_tests.cpp
    flat_views.cpp
    benchmark.cpp
)
target_link_libraries(test-clio clio catch2)
set_target_properties(test-clio PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})

if(DEFINED IS_WASM)
    target_link_libraries(test-clio basic-polyfill boost)
endif()

native_and_wasm_test(test-clio)
