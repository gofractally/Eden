configure_file(include/_config.hpp.in ${CMAKE_BINARY_DIR}/generated/config.hpp)
include_directories(${CMAKE_BINARY_DIR}/generated/)

add_executable(eden
   src/actions/accounts.cpp
   src/actions/genesis.cpp
   src/actions/induct.cpp
   src/actions/notify_assets.cpp
   src/eden.cpp
   src/accounts.cpp
   src/globals.cpp
   src/inductions.cpp
   src/members.cpp
   src/atomicassets.cpp
)
target_include_directories(eden PUBLIC include ../token/include PRIVATE ../../external/atomicassets-contract/include)
target_link_libraries(eden eosio-contract)
set_target_properties(eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
configure_file(eden.abi ${ROOT_BINARY_DIR}/eden.abi COPYONLY)

add_executable(test-eden tests/test-eden.cpp src/globals.cpp src/accounts.cpp src/members.cpp)
target_include_directories(test-eden PUBLIC include)
target_include_directories(test-eden PUBLIC ../token/include ../boot/include)
target_link_libraries(test-eden catch2 testlib)
set_target_properties(test-eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
eden_tester_test(test-eden)
