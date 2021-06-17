add_library(debug_plugin
    debug_plugin.cpp
    ../../libraries/debug_eos_vm/dwarf.cpp
)
target_link_libraries(debug_plugin chain_plugin eosio_chain appbase)
target_include_directories(debug_plugin PRIVATE
    ../../libraries/abieos/include
    ../../libraries/debug_eos_vm/include
)
eosio_additional_plugin(debug_plugin)
