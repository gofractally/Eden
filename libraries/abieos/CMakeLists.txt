add_library(abieos
    include/eosio/fpconv.c
    src/abi.cpp
    src/crypto.cpp
)
target_link_libraries(abieos PUBLIC rapidjson)
target_include_directories(abieos PUBLIC include)

if(IS_WASM)
    target_compile_options(abieos PUBLIC -fno-exceptions -D__eosio_cdt__)
    set_target_properties(abieos PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR}/clsdk/lib-wasm)

    copy_headers(include/eosio abieos/include/eosio)
    configure_file(include/eosio/fpconv.license ${ROOT_BINARY_DIR}/clsdk/licenses/LICENSE.fpconv COPYONLY)
endif()
