#pragma once

#include <array>
#include <config.hpp>
#include <eosio/asset.hpp>
#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto token_contract = "eosio.token"_n;
   inline constexpr uint64_t default_scope = 0;
   inline constexpr uint16_t max_active_members = 10000;
   inline constexpr uint32_t induction_expiration_secs = 7 * 24 * 60 * 60;  // 1 week
   inline constexpr double initial_market_fee = 0.05;

   inline constexpr uint32_t max_gc_on_induction = 32;
   inline constexpr uint32_t election_seeding_window = 24 * 60 * 60;
   inline constexpr uint32_t election_final_seeding_window = 2 * 60 * 60;
   inline constexpr uint16_t min_election_threshold = 1000;
}  // namespace eden
