add_library(debug_plugin
    debug_plugin.cpp
    ../cltester/dwarf.cpp
)
target_link_libraries(debug_plugin chain_plugin eosio_chain appbase)
target_include_directories(debug_plugin PRIVATE
    ../cltester
    ../../libraries/abieos/include
)
eosio_additional_plugin(debug_plugin)
