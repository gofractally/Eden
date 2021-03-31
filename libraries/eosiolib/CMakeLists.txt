add_library(eosio-core)
target_link_libraries(eosio-core PUBLIC abieos)
target_include_directories(eosio-core PUBLIC core)
target_compile_options(eosio-core PUBLIC -fno-exceptions -D__eosio_cdt__)
target_sources(eosio-core PRIVATE crypto.cpp)

add_library(eosio-contract)
target_link_libraries(eosio-contract PUBLIC eosio-core)
target_include_directories(eosio-contract PUBLIC contracts)
target_link_options(eosio-contract INTERFACE
    -Wl,--stack-first
    -Wl,--entry,apply
    -nostdlib
    -lc++ -lc++abi -lc
    ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
)

string(TOLOWER ${CMAKE_BUILD_TYPE} BUILD_TYPE_LOWER)
if(BUILD_TYPE_LOWER STREQUAL release OR BUILD_TYPE_LOWER STREQUAL minsizerel)
    target_link_options(eosio-contract INTERFACE -Wl,--strip-all)
endif()

target_sources(eosio-contract PRIVATE eosiolib.cpp)
