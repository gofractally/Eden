add_executable(test_clarion test/test_clarion.cpp)
target_include_directories(test_clarion PUBLIC include)
target_link_libraries(test_clarion PUBLIC catch2 -lcrypto)
set_property(TARGET test_clarion PROPERTY CXX_STANDARD 20)

add_executable(test_merkle test/test_merkle.cpp)
target_include_directories(test_merkle PUBLIC include)
target_link_libraries(test_merkle PUBLIC catch2 -lcrypto)
set_property(TARGET test_merkle PROPERTY CXX_STANDARD 20)
