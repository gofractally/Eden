#pragma once

#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include "token_ricardian.hpp"

namespace token
{
   struct account
   {
      eosio::asset balance;

      bool operator==(const account&) const = default;
      bool operator!=(const account&) const = default;
      uint64_t primary_key() const { return balance.symbol.code().raw(); }
   };
   EOSIO_REFLECT(account, balance)

   typedef eosio::multi_index<"accounts"_n, account> accounts;

   struct currency_stats
   {
      eosio::asset supply;
      eosio::asset max_supply;
      eosio::name issuer;

      bool operator==(const currency_stats&) const = default;
      bool operator!=(const currency_stats&) const = default;
      uint64_t primary_key() const { return supply.symbol.code().raw(); }
   };
   EOSIO_REFLECT(currency_stats, supply, max_supply, issuer)

   typedef eosio::multi_index<"stat"_n, currency_stats> stats;

   class contract : public eosio::contract
   {
     public:
      using eosio::contract::contract;

      using account = token::account;
      using accounts = token::accounts;
      using currency_stats = token::currency_stats;
      using stats = token::stats;

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

      void sub_balance(eosio::name owner, const eosio::asset& value);
      void add_balance(eosio::name owner, const eosio::asset& value, eosio::name ram_payer);
   };

   EOSIO_ACTIONS(contract,
                 "eosio.token"_n,
                 action(create, issuer, maximum_supply, ricardian_contract(create_ricardian)),
                 action(issue, to, quantity, memo, ricardian_contract(issue_ricardian)),
                 action(retire, quantity, memo, ricardian_contract(retire_ricardian)),
                 action(transfer, from, to, quantity, memo, ricardian_contract(transfer_ricardian)),
                 action(open, owner, symbol, ram_payer, ricardian_contract(open_ricardian)),
                 action(close, owner, symbol, ricardian_contract(close_ricardian)))
}  // namespace token
