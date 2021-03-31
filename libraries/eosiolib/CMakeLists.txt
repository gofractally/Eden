add_library(eosio-core)
target_link_libraries(eosio-core PUBLIC abieos)
target_include_directories(eosio-core PUBLIC core)
target_sources(eosio-core PRIVATE crypto.cpp)

add_library(eosio-contract)
target_link_libraries(eosio-contract PUBLIC eosio-core)
target_include_directories(eosio-contract PUBLIC contracts)
target_sources(eosio-contract PRIVATE eosiolib.cpp)
