add_executable(eden
   src/actions/hi.cpp
   src/actions/transfer_handler.cpp
   src/eden.cpp
   src/members.cpp
)
target_include_directories(eden PUBLIC include)
target_link_libraries(eden eosio-contract)
set_target_properties(eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
# configure_file(eden.abi ${ROOT_BINARY_DIR}/eden.abi COPYONLY)
