#include <eosio/action.hpp>

#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

namespace get_code
{
   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      void shouldhave(eosio::name account)
      {
         eosio::check(eosio::has_code(account), "has no code");
      }

      void shouldnot(eosio::name account)
      {  //
         eosio::check(!eosio::has_code(account), "has code");
      }

      void print(eosio::name account)
      {
         eosio::print(eosio::format_json(eosio::get_code_hash(account)));
      }
   };

   EOSIO_ACTIONS(contract,
                 "getcode"_n,
                 action(shouldhave, account),
                 action(shouldnot, account),
                 action(print, account))
}  // namespace get_code
