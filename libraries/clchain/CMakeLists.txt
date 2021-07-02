find_package(OpenSSL REQUIRED Crypto)

function(add suffix)
    add_library(clchain${suffix})
    target_link_libraries(clchain${suffix} PUBLIC abieos${suffix} boost OpenSSL::Crypto)
    target_include_directories(clchain${suffix} PUBLIC include)
    target_sources(clchain${suffix} PRIVATE
        src/crypto.cpp
    )
    if(DEFINED IS_WASM)
        target_link_libraries(clchain${suffix} PUBLIC wasm-base${suffix})
    endif()
endfunction()

add("")
if(DEFINED IS_WASM)
    add("-debug")
endif()
