configure_file(include/_config.hpp.in ${CMAKE_BINARY_DIR}/generated/config.hpp)
include_directories(${CMAKE_BINARY_DIR}/generated/)

add_executable(eden
   src/actions/accounts.cpp
   src/actions/genesis.cpp
   src/actions/induct.cpp
   src/actions/notify_assets.cpp
   src/actions/migrate.cpp
   src/eden.cpp
   src/accounts.cpp
   src/globals.cpp
   src/inductions.cpp
   src/members.cpp
   src/auctions.cpp
   src/migrations.cpp
   src/atomicassets.cpp
)
target_include_directories(eden PUBLIC include ../token/include PRIVATE ../../external/atomicassets-contract/include)
target_link_libraries(eden eosio-contract)
set_target_properties(eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})

add_executable(eden-abigen src/eden.cpp src/eden-ricardian.cpp)
target_include_directories(eden-abigen PRIVATE include ../token/include ../../external/atomicassets-contract/include)
target_link_libraries(eden-abigen eosio-contract-abigen)
add_custom_command(TARGET eden-abigen POST_BUILD
    COMMAND ${ROOT_BINARY_DIR}/cltester eden-abigen.wasm >${ROOT_BINARY_DIR}/eden.abi
)

add_executable(test-eden tests/test-eden.cpp src/globals.cpp src/accounts.cpp src/members.cpp src/atomicassets.cpp)
target_include_directories(test-eden PUBLIC include)
target_include_directories(test-eden PUBLIC ../token/include ../boot/include ../../external/atomicassets-contract/include)
target_link_libraries(test-eden catch2 cltestlib)
set_target_properties(test-eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-eden)
