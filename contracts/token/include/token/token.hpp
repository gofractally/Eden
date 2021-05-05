#pragma once

#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

namespace token
{
   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      void create(eosio::name issuer, const eosio::asset& maximum_supply);
      void issue(eosio::name to, const eosio::asset& quantity, const std::string& memo);
      void retire(const eosio::asset& quantity, const std::string& memo);
      void transfer(eosio::name from,
                    eosio::name to,
                    const eosio::asset& quantity,
                    const std::string& memo);
      void open(eosio::name owner, eosio::symbol symbol, eosio::name ram_payer);
      void close(eosio::name owner, eosio::symbol symbol);

      static eosio::asset get_supply(eosio::name token_contract_account,
                                     eosio::symbol_code sym_code)
      {
         stats statstable(token_contract_account, sym_code.raw());
         const auto& st = statstable.get(sym_code.raw());
         return st.supply;
      }

      static eosio::asset get_balance(eosio::name token_contract_account,
                                      eosio::name owner,
                                      eosio::symbol_code sym_code)
      {
         accounts accountstable(token_contract_account, owner.value);
         const auto& ac = accountstable.get(sym_code.raw());
         return ac.balance;
      }

      struct account
      {
         eosio::asset balance;

         bool operator==(const account&) const = default;
         bool operator!=(const account&) const = default;
         uint64_t primary_key() const { return balance.symbol.code().raw(); }
      };

      struct currency_stats
      {
         eosio::asset supply;
         eosio::asset max_supply;
         eosio::name issuer;

         bool operator==(const currency_stats&) const = default;
         bool operator!=(const currency_stats&) const = default;
         uint64_t primary_key() const { return supply.symbol.code().raw(); }
      };

      typedef eosio::multi_index<"accounts"_n, account> accounts;
      typedef eosio::multi_index<"stat"_n, currency_stats> stats;

      void sub_balance(eosio::name owner, const eosio::asset& value);
      void add_balance(eosio::name owner, const eosio::asset& value, eosio::name ram_payer);
   };

   EOSIO_REFLECT(contract::account, balance)

   EOSIO_REFLECT(contract::currency_stats, supply, max_supply, issuer)

   EOSIO_ACTIONS(contract, "eosio.token"_n, create, issue, retire, transfer, open, close)
}  // namespace token
