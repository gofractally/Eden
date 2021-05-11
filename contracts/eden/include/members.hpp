#pragma once

#include <constants.hpp>
#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <globals.hpp>
#include <string>
#include <utils.hpp>

namespace eden
{
   using member_status_type = uint8_t;
   enum member_status : member_status_type
   {
      pending_membership = 0,
      active_member = 1
   };

   struct member_v0
   {
      eosio::name account;
      std::string name;
      member_status_type status;
      uint64_t nft_template_id;
      uint64_t election_sequence = 0;  // Only reflected in v1

      uint64_t primary_key() const { return account.value; }
   };
   EOSIO_REFLECT(member_v0, account, name, status, nft_template_id)

   // What do we need to know?
   // - Whether a member has donated (before or after the election?  must be before minting NFTs).
   // - A donation is required for regularly scheduled elections.
   // - Are donations and NFTs relevent for special elections?
   // - Whether a member was active at the start of the election.
   //
   // A user can donate at any time between regularly scheduled elections.
   // Such a donation makes him eligible to vote in the next election.
   // Members who did not donate will be deactivated
   //
   // A member is active iff election_sequence >=
   // If a member donates while an election is in progress?
   // When a member is activated, election_sequence is set to what the election_sequence will be at the end of the current election.
   //
   // Need to distinguish the following:
   // - induct, start election: in current election
   // - donate, election, donate, election: normal flow
   // - start election, induct new: eligible for the next election, not the current election
   // - failed to donate, start election: deactivated
   // - donate, start election, donate, finish election: should be eligible for the next election.  Not allowed.  Donation becomes available for active members after the election finishes.
   //
   // A member is part of the election iff election_sequence == election_info.election_sequence - 1
   // A an active member can donate if election_sequence == election_info.election_sequence - 1 and there is not a current election.
   struct member_v1 : member_v0
   {
   };
   EOSIO_REFLECT(member_v1, base member_v0, election_sequence);

   struct member
   {
      member() = default;
      member(const member&) = delete;
      std::variant<member_v0, member_v1> value;
      EDEN_FORWARD_MEMBERS(value, account, name, status, nft_template_id, election_sequence);
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(member, value)

   using member_table_type = eosio::multi_index<"member"_n, member>;

   struct member_stats_v0
   {
      uint16_t active_members;
      uint16_t pending_members;
      uint16_t completed_waiting_inductions;
   };
   EOSIO_REFLECT(member_stats_v0, active_members, pending_members, completed_waiting_inductions);

   using member_stats_singleton = eosio::singleton<"memberstats"_n, std::variant<member_stats_v0>>;

   class members
   {
     private:
      eosio::name contract;
      member_table_type member_tb;
      globals globals;
      member_stats_singleton member_stats;

     public:
      members(eosio::name contract)
          : contract(contract),
            member_tb(contract, default_scope),
            globals(contract),
            member_stats(contract, default_scope)
      {
      }

      const member& get_member(eosio::name account);
      void create(eosio::name account);
      void remove_if_pending(eosio::name account);
      bool is_new_member(eosio::name account) const;
      void check_active_member(eosio::name account);
      void check_pending_member(eosio::name account);
      void deposit(eosio::name account, const eosio::asset& quantity);
      void set_nft(eosio::name account, int32_t nft_template_id);
      void set_active(eosio::name account, const std::string& name);
      void renew(eosio::name account);
      member_stats_v0 stats();

      // this method is used only for administrative purposes,
      // it should never be used outside genesis or test environments
      void clear_all();
   };

}  // namespace eden
