#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <globals.hpp>
#include <string>

namespace eden
{
   using member_status_type = uint8_t;
   enum member_status : member_status_type
   {
      pending_membership = 0,
      active_member = 1
   };

   struct member
   {
      eosio::name account;
      member_status_type status;
      uint64_t nft_template_id;

      uint64_t primary_key() const { return account.value; }
   };
   EOSIO_REFLECT(member, account, status, nft_template_id)

   using member_table_type = eosio::multi_index<"member"_n, member>;

   struct member_stats
   {
      uint16_t active_members;
      uint16_t pending_members;
      uint16_t completed_waiting_inductions;
   };
   EOSIO_REFLECT(member_stats, active_members, pending_members, completed_waiting_inductions);

   using member_stats_singleton = eosio::singleton<"memberstats"_n, member_stats>;

   class members
   {
     private:
      eosio::name contract;
      member_table_type member_tb;
      globals globals;
      member_stats_singleton member_stats;

      bool is_new_member(eosio::name account) const;

     public:
      members(eosio::name contract)
          : contract(contract),
            member_tb(contract, default_scope),
            globals(contract),
            member_stats(contract, default_scope)
      {
      }

      void create(eosio::name account);
      void check_active_member(eosio::name account);
      void check_pending_member(eosio::name account);
      void deposit(eosio::name account, const eosio::asset& quantity);
      void set_nft(eosio::name account, int32_t nft_template_id);
      void set_active(eosio::name account);
      struct member_stats stats();

      // this method is used only for administrative purposes,
      // it should never be used outside genesis or test environments
      void clear_all();
   };

}  // namespace eden
