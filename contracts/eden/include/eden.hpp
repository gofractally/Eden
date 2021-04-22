#pragma once

#include <atomicassets.hpp>
#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <inductions.hpp>
#include <string>
#include <vector>

namespace eden
{
   class eden : public eosio::contract
   {
     public:
      using contract::contract;

      eden(eosio::name receiver, eosio::name code, eosio::datastream<const char*> ds)
          : contract(receiver, code, ds)
      {
      }

      void notify_transfer(eosio::name from,
                           eosio::name to,
                           const eosio::asset& quantity,
                           std::string memo);

      void genesis(std::string community,
                   eosio::symbol community_symbol,
                   eosio::asset minimum_donation,
                   std::vector<eosio::name> initial_members,
                   std::string genesis_video,
                   eosio::asset auction_starting_bid,
                   uint32_t auction_duration,
                   eosio::ignore<std::string> memo);

      void inductinit(uint64_t id,
                      eosio::name inviter,
                      eosio::name invitee,
                      std::vector<eosio::name> witnesses);

      void inductprofil(uint64_t id, new_member_profile new_member_profile);

      void inductvideo(eosio::name account,
                       uint64_t id,
                       std::string video);

      void inductendorse(eosio::name account, uint64_t id, eosio::checksum256 induction_data_hash);

      void inducted(eosio::name inductee);

      void notify_lognewtempl(int32_t template_id,
                              eosio::name authorized_creator,
                              eosio::name collection_name,
                              eosio::name schema_name,
                              bool transferable,
                              bool burnable,
                              uint32_t max_supply,
                              const atomicassets::attribute_map& immutable_data);

      void notify_logmint(uint64_t asset_id,
                          eosio::name authorized_minter,
                          eosio::name collection_name,
                          eosio::name schema_name,
                          int32_t template_id,
                          eosio::name new_asset_owner,
                          const atomicassets::attribute_map& immutable_data,
                          const atomicassets::attribute_map& mutable_data,
                          std::vector<eosio::asset> tokens_to_back);
   };

   EOSIO_ACTIONS(eden, "eden"_n, genesis, inductinit, inductprofil, inductvideo, inductendorse, inducted, notify transfer, notify lognewtempl, notify logmint)
}  // namespace eden
