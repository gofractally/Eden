add_executable(bios2 src/bios2.cpp)
target_include_directories(bios2 PUBLIC include)
target_link_libraries(bios2 eosio-contract-simple-malloc)
set_target_properties(bios2 PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)

add_executable(bios2-abigen src/bios2.cpp)
target_include_directories(bios2-abigen PUBLIC include)
target_link_libraries(bios2-abigen eosio-contract-abigen)
add_custom_command(TARGET bios2-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester bios2-abigen.wasm >${ROOT_BINARY_DIR}/clsdk/contracts/bios2.abi
)

configure_file(include/bios2/bios2.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios2/include/bios2/bios2.hpp COPYONLY)
configure_file(src/bios2.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios2/src/bios2.cpp COPYONLY)
