#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <string>

namespace eden
{
   inline constexpr eosio::asset minimum_membership_donation{minimum_donation, default_token,
                                                             eosio::no_check};

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

   class members
   {
     private:
      eosio::name contract;
      member_table_type member_tb;

      bool is_new_member(eosio::name account) const;
      void create(eosio::name account);

     public:
      members(eosio::name contract) : contract(contract), member_tb(contract, default_scope) {}

      void check_active_member(eosio::name account);
      void check_pending_member(eosio::name account);
      void deposit(eosio::name account, const eosio::asset& quantity);
   };

}  // namespace eden
