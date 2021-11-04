#pragma once

#include <eosio/action.hpp>

namespace eden
{
   struct auth_info
   {
      void require_auth(eosio::name account) const { eosio::require_auth(account); }
   };
}  // namespace eden
