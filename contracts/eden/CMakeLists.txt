configure_file(include/_config.hpp.in ${CMAKE_BINARY_DIR}/generated/config.hpp)
include_directories(${CMAKE_BINARY_DIR}/generated/)

add_executable(eden
   src/actions/genesis.cpp
   src/actions/induct.cpp
   src/actions/notify_assets.cpp
   src/actions/notify_transfer.cpp
   src/eden.cpp
   src/globals.cpp
   src/inductions.cpp
   src/members.cpp
   src/atomicassets.cpp
)
target_include_directories(eden PUBLIC include PRIVATE ../../external/atomicassets-contract/include)
target_link_libraries(eden eosio-contract)
set_target_properties(eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
configure_file(eden.abi ${ROOT_BINARY_DIR}/eden.abi COPYONLY)
