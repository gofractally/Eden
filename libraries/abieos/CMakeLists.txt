add_library(abieos INTERFACE)
target_link_libraries(abieos INTERFACE boost rapidjson)
target_include_directories(abieos INTERFACE include)
