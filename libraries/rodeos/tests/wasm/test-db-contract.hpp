#include <eosio/eosio.hpp>

namespace test_db
{
   inline constexpr auto account = "testdb"_n;

   struct test_db_contract : eosio::contract
   {
      using eosio::contract::contract;

      void write();
      void read();
   };
   EOSIO_ACTIONS(test_db_contract, account, write, read)

}  // namespace test_db
