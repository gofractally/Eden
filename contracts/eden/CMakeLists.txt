configure_file(include/_config.hpp.in ${CMAKE_BINARY_DIR}/generated/config.hpp)
include_directories(${CMAKE_BINARY_DIR}/generated/)

set(extra-sources)
set(EDEN_ENABLE_SET_TABLE_ROWS "no" CACHE BOOL "Enable the settablerows action")
if(EDEN_ENABLE_SET_TABLE_ROWS)
  add_definitions(-DENABLE_SET_TABLE_ROWS)
endif()

add_executable(eden
   src/actions/accounts.cpp
   src/actions/genesis.cpp
   src/actions/induct.cpp
   src/actions/elect.cpp
   src/actions/notify_assets.cpp
   src/actions/bylaws.cpp
   src/actions/migrate.cpp
   src/actions/encrypt.cpp
   src/actions/tables.cpp
   src/eden.cpp
   src/events.cpp
   src/accounts.cpp
   src/globals.cpp
   src/inductions.cpp
   src/members.cpp
   src/auctions.cpp
   src/migrations.cpp
   src/atomicassets.cpp
   src/elections.cpp
   src/bylaws.cpp
   src/distributions.cpp
   src/encrypt.cpp
)
target_include_directories(eden PUBLIC include ../token/include PRIVATE ../../external/atomicassets-contract/include)
target_link_libraries(eden eosio-contract)
set_target_properties(eden PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})

add_executable(eden-abigen src/eden.cpp src/eden-ricardian.cpp)
target_include_directories(eden-abigen PRIVATE include ../token/include ../../external/atomicassets-contract/include)
target_link_libraries(eden-abigen eosio-contract-abigen)
add_custom_command(TARGET eden-abigen POST_BUILD
    COMMAND ${ROOT_BINARY_DIR}/cltester eden-abigen.wasm >${ROOT_BINARY_DIR}/eden.abi
)

function(add_test_eden suffix)
    add_executable(test-eden${suffix} tests/test-eden.cpp src/globals.cpp src/accounts.cpp src/members.cpp src/atomicassets.cpp src/elections.cpp)
    target_include_directories(test-eden${suffix} PUBLIC include)
    target_include_directories(test-eden${suffix} PUBLIC
        ../token/include
        ../boot/include
        ../../external/atomicassets-contract/include
        ../../libraries/clchain/include
    )
    target_link_libraries(test-eden${suffix} catch2 cltestlib${suffix})
    set_target_properties(test-eden${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
endfunction()

add_test_eden("")
add_test_eden("-debug")
eden_tester_test(test-eden)

function(add_eden_microchain suffix)
    add_executable(eden-micro-chain${suffix}
        src/eden-micro-chain.cpp
    )
    target_link_libraries(eden-micro-chain${suffix} clchain${suffix} eosio-contracts-wasi-polyfill${suffix})
    target_include_directories(eden-micro-chain${suffix} PRIVATE
        include
        ../../libraries/eosiolib/contracts/include
        ../../libraries/eosiolib/core/include
    )
    set_target_properties(eden-micro-chain${suffix} PROPERTIES RUNTIME_OUTPUT_DIRECTORY ${ROOT_BINARY_DIR})
    target_link_options(eden-micro-chain${suffix} PRIVATE
        -Wl,--stack-first
        -Wl,--no-entry
        -Wl,-z,stack-size=8192
        -nostdlib
        -lc++
        -lc++abi
        -lc
        ${WASI_SDK_PREFIX}/lib/clang/11.0.0/lib/wasi/libclang_rt.builtins-wasm32.a
    )
    add_dependencies(eden-micro-chain${suffix} eden)
endfunction()
add_eden_microchain("")
# add_eden_microchain("-debug")
