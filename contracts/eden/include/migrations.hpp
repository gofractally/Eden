#pragma once

#include <eosio/name.hpp>

namespace eden
{
   class migrations
   {
     private:
      eosio::name contract;

     public:
      migrations(eosio::name contract) : contract(contract) {}
      void init();
      void clear_all();
      uint32_t migrate_some(uint32_t max_steps);
   };
}  // namespace eden
