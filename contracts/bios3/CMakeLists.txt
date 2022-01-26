add_executable(bios3 src/bios3.cpp)
target_include_directories(bios3 PUBLIC include)
target_link_libraries(bios3 eosio-contract-simple-malloc)
set_target_properties(bios3 PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)

add_executable(bios3-abigen src/bios3.cpp)
target_include_directories(bios3-abigen PUBLIC include)
target_link_libraries(bios3-abigen eosio-contract-abigen)
add_custom_command(TARGET bios3-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester bios3-abigen.wasm >${ROOT_BINARY_DIR}/clsdk/contracts/bios3.abi
)

configure_file(include/bios3/bios3.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios3/include/bios3/bios3.hpp COPYONLY)
configure_file(src/bios3.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios3/src/bios3.cpp COPYONLY)
