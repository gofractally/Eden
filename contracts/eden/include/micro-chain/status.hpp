#pragma once

#include "_tables.hpp"
#include "_types.hpp"

namespace micro_chain
{
   const auto& get_status()
   {
      auto& idx = db.status.get<by_id>();
      eosio::check(idx.size() == 1, "missing genesis action");
      return *idx.begin();
   }
}  // namespace micro_chain