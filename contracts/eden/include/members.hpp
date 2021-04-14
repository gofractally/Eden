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
      pending = 0,
      active = 1,
      expired = 2
   };

   struct member
   {
      eosio::name member;
      eosio::asset balance;
      member_status_type status;

      uint64_t primary_key() const { return member.value; }
   };
   EOSIO_REFLECT(member, member, balance, status)

   using members_table_type = eosio::multi_index<"members"_n, member>;

   class members
   {
     private:
      eosio::name contract;
      members_table_type members_tb;

     public:
      members(eosio::name contract) : contract(contract), members_tb(contract, default_scope) {}

      void deposit(eosio::name member, eosio::asset quantity);
   };

}  // namespace eden
