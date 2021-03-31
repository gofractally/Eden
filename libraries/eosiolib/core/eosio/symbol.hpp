/**
 *  @file
 *  @copyright defined in eos/LICENSE
 */
#pragma once

#include <eosio/print.hpp>
#include_next <eosio/symbol.hpp>

namespace eosio
{
   inline void print(symbol obj) { print(obj.to_string()); }

}  // namespace eosio
