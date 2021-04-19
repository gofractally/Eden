add_library(abieos
    src/crypto.cpp
)
target_link_libraries(abieos PUBLIC rapidjson)
target_include_directories(abieos PUBLIC include)

if(IS_WASM)
    target_compile_options(abieos PUBLIC -fno-exceptions -D__eosio_cdt__)
endif()
