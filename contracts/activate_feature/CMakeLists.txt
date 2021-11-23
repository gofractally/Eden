add_executable(activate_feature src/activate_feature.cpp)
target_include_directories(activate_feature PUBLIC include)
target_link_libraries(activate_feature eosio-contract-simple-malloc)
set_target_properties(activate_feature PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/contracts)

add_executable(activate_feature-abigen src/activate_feature.cpp)
target_include_directories(activate_feature-abigen PUBLIC include)
target_link_libraries(activate_feature-abigen eosio-contract-abigen)
add_custom_command(TARGET activate_feature-abigen POST_BUILD
    COMMAND mkdir -p ${ROOT_BINARY_DIR}/clsdk/contracts
    COMMAND ${ROOT_BINARY_DIR}/cltester activate_feature-abigen.wasm >${ROOT_BINARY_DIR}/clsdk/contracts/activate_feature.abi
)

configure_file(include/activate_feature/activate_feature.hpp ${ROOT_BINARY_DIR}/clsdk/contracts/activate_feature/include/activate_feature/activate_feature.hpp COPYONLY)
configure_file(src/activate_feature.cpp ${ROOT_BINARY_DIR}/clsdk/contracts/activate_feature/src/activate_feature.cpp COPYONLY)
