#pragma once

#include <constants.hpp>
#include <eden-atomicassets.hpp>
#include <eosio/asset.hpp>
#include <eosio/bytes.hpp>
#include <eosio/eosio.hpp>
#include <inductions.hpp>
#include <string>
#include <vector>

namespace eden
{
   // Ricardian contracts live in eden-ricardian.cpp
   extern const char* withdraw_ricardian;
   extern const char* genesis_ricardian;
   extern const char* clearall_ricardian;
   extern const char* inductinit_ricardian;
   extern const char* inductprofil_ricardian;
   extern const char* inductvideo_ricardian;
   extern const char* inductendors_ricardian;
   extern const char* inductdonate_ricardian;
   extern const char* inductcancel_ricardian;
   extern const char* gc_ricardian;
   extern const char* inducted_ricardian;
   extern const char* peacetreaty_clause;
   extern const char* bylaws_clause;

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

      void donate(eosio::name payer, const eosio::asset& quantity);

      void transfer(eosio::name to, const eosio::asset& quantity, const std::string& memo);

      void genesis(std::string community,
                   eosio::symbol community_symbol,
                   eosio::asset minimum_donation,
                   std::vector<eosio::name> initial_members,
                   std::string genesis_video,
                   atomicassets::attribute_map collection_attributes,
                   eosio::asset auction_starting_bid,
                   uint32_t auction_duration,
                   uint8_t election_day,
                   const std::string& election_time,
                   eosio::ignore<std::string> memo);

      void addtogenesis(eosio::name new_genesis_member, eosio::time_point expiration);
      void gensetexpire(uint64_t induction_id, eosio::time_point new_expiration);

      void clearall();

      void inductinit(uint64_t id,
                      eosio::name inviter,
                      eosio::name invitee,
                      std::vector<eosio::name> witnesses);

      void inductprofil(uint64_t id, new_member_profile new_member_profile);

      void inductvideo(eosio::name account, uint64_t id, std::string video);

      void inductendors(eosio::name account, uint64_t id, eosio::checksum256 induction_data_hash);

      void inductdonate(eosio::name payer, uint64_t id, const eosio::asset& quantity);

      void inductcancel(eosio::name account, uint64_t id);

      void inducted(eosio::name inductee);

      void electseed(const eosio::bytes& btc_header);

      void electinit();

      void electprepare(uint32_t max_steps);

      void electvote(uint8_t round, eosio::name voter, eosio::name candidate);
      void electprocess(uint32_t max_steps);

      void distribute(uint32_t max_steps);

      void bylawspropose(eosio::name proposer, const std::string& bylaws);
      void bylawsapprove(eosio::name approver, const eosio::checksum256& bylaws_hash);
      void bylawsratify(eosio::name approver, const eosio::checksum256& bylaws_hash);

      void electadvance(uint64_t group);

      void gc(uint32_t limit);

      // Update contract tables to the latest version of the contract, where necessary.
      // New functionality may be unavailable until this is complete.
      void migrate(uint32_t limit);
      // For testing only.
      void unmigrate();

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

   EOSIO_ACTIONS(
       eden,
       "eden.gm"_n,
       action(withdraw, owner, quantity, ricardian_contract(withdraw_ricardian)),
       action(donate, owner, quantity),
       action(transfer, to, quantity, memo),
       action(genesis,
              community,
              community_symbol,
              minimum_donation,
              initial_members,
              genesis_video,
              collection_attributes,
              auction_starting_bid,
              auction_duration,
              election_day,
              election_time,
              memo,
              ricardian_contract(genesis_ricardian)),
       action(addtogenesis, account, expiration),
       action(gensetexpire, id, new_expiration),
       action(clearall, ricardian_contract(clearall_ricardian)),
       action(inductinit,
              id,
              inviter,
              invitee,
              witnesses,
              ricardian_contract(inductinit_ricardian)),
       action(inductprofil, id, new_member_profile, ricardian_contract(inductprofil_ricardian)),
       action(inductvideo, account, id, video, ricardian_contract(inductvideo_ricardian)),
       action(inductendors,
              account,
              id,
              induction_data_hash,
              ricardian_contract(inductendors_ricardian)),
       action(electseed, btc_header),
       action(electinit),
       action(electprepare, max_steps),
       action(electvote, round, voter, candidate),
       action(electprocess, max_steps),
       action(distribute, max_steps),
       action(inductdonate, payer, id, quantity, ricardian_contract(inductdonate_ricardian)),
       action(inductcancel, account, id, ricardian_contract(inductcancel_ricardian)),
       action(inducted, inductee, ricardian_contract(inducted_ricardian)),
       action(gc, limit, ricardian_contract(gc_ricardian)),
       action(migrate, limit),
       action(unmigrate),
       notify(token_contract, transfer),
       notify(atomic_assets_account, lognewtempl),
       notify(atomic_assets_account, logmint))
}  // namespace eden
