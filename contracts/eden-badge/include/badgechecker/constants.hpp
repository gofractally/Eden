#pragma once

#include <eosio/name.hpp>

namespace eden
{
   inline constexpr auto eden_account = "genesis.eden"_n;
   inline const std::vector<eosio::name> allowed_actions = {"givesimple"_n, "initsimple"_n};
   inline constexpr uint8_t max_accounts = 5;
}  // namespace eden