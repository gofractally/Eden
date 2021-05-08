#pragma once
#include <eosio/dispatcher.hpp>

#ifdef COMPILING_ABIGEN
#include <stdio.h>

#define EOSIO_ABIGEN(...) \
   int main() { printf("hello\n"); }
#else
#define EOSIO_ABIGEN(...)
#endif
