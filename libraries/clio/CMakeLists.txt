enable_testing()

add_library(clio INTERFACE)
target_link_libraries(clio INTERFACE rapidjson)
target_include_directories(clio INTERFACE include ${Boost_INCLUDE_DIRS})

add_subdirectory(tests)
