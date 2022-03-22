add_executable(bios src/bios.cpp)
target_include_directories(bios PUBLIC include)
target_link_libraries(bios eosio-contract-simple-malloc)
set_target_properties(bios PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)

add_executable(bios-abigen src/bios.cpp)
target_include_directories(bios-abigen PUBLIC include)
target_link_libraries(bios-abigen eosio-contract-abigen)
add_custom_command(TARGET bios-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester bios-abigen.wasm >${ROOT_BINARY_DIR}/clsdk/contracts/bios.abi
)

configure_file(include/bios/bios.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios/include/bios/bios.hpp COPYONLY)
configure_file(src/bios.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/bios/src/bios.cpp COPYONLY)
