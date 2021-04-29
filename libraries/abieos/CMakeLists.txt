add_library(abieos
    include/eosio/fpconv.c
    src/abi.cpp
    src/crypto.cpp
)
target_link_libraries(abieos PUBLIC rapidjson)
target_include_directories(abieos PUBLIC include)

if(IS_WASM)
    target_compile_options(abieos PUBLIC -fno-exceptions -D__eosio_cdt__)
    copy_headers(include/eosio abieos/include/eosio)
    file(COPY include/eosio/fpconv.license DESTINATION ${ROOT_BINARY_DIR}/clsdk/licenses)
    file(RENAME
        ${ROOT_BINARY_DIR}/clsdk/licenses/fpconv.license
        ${ROOT_BINARY_DIR}/clsdk/licenses/LICENSE.fpconv)
endif()
