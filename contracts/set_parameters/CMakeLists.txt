add_executable(set_parameters src/set_parameters.cpp)
target_include_directories(set_parameters PUBLIC include)
target_link_libraries(set_parameters eosio-contract-simple-malloc)
set_target_properties(set_parameters PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)

add_executable(set_parameters-abigen src/set_parameters.cpp)
target_include_directories(set_parameters-abigen PUBLIC include)
target_link_libraries(set_parameters-abigen eosio-contract-abigen)
add_custom_command(TARGET set_parameters-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester set_parameters-abigen.wasm >${ROOT_BINARY_DIR}/clsdk/contracts/set_parameters.abi
)

configure_file(include/set_parameters/set_parameters.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/set_parameters/include/set_parameters/set_parameters.hpp COPYONLY)
configure_file(src/set_parameters.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/set_parameters/src/set_parameters.cpp COPYONLY)
