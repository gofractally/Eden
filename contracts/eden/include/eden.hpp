#pragma once

#include <constants.hpp>
#include <eden-atomicassets.hpp>
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

      void withdraw(eosio::name owner, const eosio::asset& quantity);

      void genesis(std::string community,
                   eosio::symbol community_symbol,
                   eosio::asset minimum_donation,
                   std::vector<eosio::name> initial_members,
                   std::string genesis_video,
                   atomicassets::attribute_map collection_attributes,
                   eosio::asset auction_starting_bid,
                   uint32_t auction_duration,
                   eosio::ignore<std::string> memo);

      void clearall();

      void inductinit(uint64_t id,
                      eosio::name inviter,
                      eosio::name invitee,
                      std::vector<eosio::name> witnesses);

      void inductprofil(uint64_t id, new_member_profile new_member_profile);

      void inductvideo(eosio::name account, uint64_t id, std::string video);

      void inductendorse(eosio::name account, uint64_t id, eosio::checksum256 induction_data_hash);

      void inductdonate(eosio::name payer, uint64_t id, const eosio::asset& quantity);

      void inductcancel(eosio::name account, uint64_t id);

      void inducted(eosio::name inductee);

      void gc(uint32_t limit);

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
                          eosio::ignore<atomicassets::attribute_map>,
                          eosio::ignore<atomicassets::attribute_map>,
                          eosio::ignore<std::vector<eosio::asset>>);
   };

   EOSIO_ACTIONS(eden,
                 "eden.gm"_n,
                 clearall,
                 genesis,
                 withdraw,
                 inductinit,
                 inductprofil,
                 inductvideo,
                 inductendorse,
                 inductdonate,
                 inducted,
                 inductcancel,
                 gc,
                 notify(token_contract, transfer),
                 notify(atomic_assets_account, lognewtempl),
                 notify(atomic_assets_account, logmint))
}  // namespace eden
