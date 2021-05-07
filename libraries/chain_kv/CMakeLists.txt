enable_testing()

add_library(chain_kv INTERFACE)
target_link_libraries(chain_kv INTERFACE eos-fc rocksdb)
target_include_directories(chain_kv INTERFACE ${CMAKE_CURRENT_SOURCE_DIR}/include)
add_subdirectory(unit_tests)
