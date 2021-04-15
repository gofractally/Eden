#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <string>

namespace eden
{
   struct new_member_profile
   {
      std::string name;
      std::string img;
      std::string bio;
      std::string social;
   };
   EOSIO_REFLECT(new_member_profile, name, img, bio)

   struct induction
   {
      uint64_t id;
      eosio::name inviter;
      eosio::name invitee;
      std::vector<eosio::name> witnesses;
      std::vector<eosio::name> endorsements;
      eosio::block_timestamp created_at;
      std::string video;
      new_member_profile new_member_profile;

      uint64_t primary_key() const { return id; }
   };
   EOSIO_REFLECT(induction,
                 id,
                 inviter,
                 invitee,
                 witnesses,
                 endorsements,
                 created_at,
                 video,
                 new_member_profile)

   using induction_table_type = eosio::multi_index<"induction"_n, induction>;

   class inductions
   {
     private:
      eosio::name contract;
      induction_table_type induction_tb;

      void create(){};
      void remove(){};

     public:
      inductions(eosio::name contract) : contract(contract), induction_tb(contract, default_scope)
      {
      }

      void init(){};
   };

}  // namespace eden
