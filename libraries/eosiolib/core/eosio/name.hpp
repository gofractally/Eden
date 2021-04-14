/**
 *  @file
 *  @copyright defined in eos/LICENSE
 */
#pragma once

#include_next <eosio/name.hpp>

/// @cond IMPLEMENTATIONS

namespace eosio
{
   namespace internal_use_do_not_use
   {
      extern "C"
      {
         [[clang::import_name("printn")]] void printn(uint64_t);
      }
   }  // namespace internal_use_do_not_use

   inline void print(name obj) { internal_use_do_not_use::printn(obj.value); }

}  // namespace eosio

using namespace eosio::literals;

/// @endcond
