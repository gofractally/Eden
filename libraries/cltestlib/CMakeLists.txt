add_library(cltestlib cltestlib.cpp)
target_include_directories(cltestlib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")
target_link_libraries(cltestlib PUBLIC chain)
