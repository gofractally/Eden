#pragma once

#include <array>
#include <config.hpp>
#include <eosio/asset.hpp>
#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto token_contract = "eosio.token"_n;
   inline constexpr uint64_t default_scope = 0;
   inline constexpr uint32_t induction_expiration_secs = 7 * 24 * 60 * 60;  // 1 week

   inline constexpr std::array<eosio::name, 5> genesis_pool{
       "edenmember11"_n, "edenmember12"_n, "edenmember13"_n, "edenmember14"_n, "edenmember15"_n};
}  // namespace eden
