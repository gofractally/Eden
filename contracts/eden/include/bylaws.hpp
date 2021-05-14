#pragma once

#include <constants.hpp>
#include <eosio/multi_index.hpp>
#include <eosio/name.hpp>
#include <string>
#include <utils.hpp>
#include <vector>

namespace eden
{
   struct bylaws_v0
   {
      eosio::name type;
      std::string text;
      eosio::block_timestamp time;
      std::vector<eosio::name> approvals;

      auto primary_key() const { return type.value; }
   };
   EOSIO_REFLECT(bylaws_v0, type, text, time, approvals)

   using bylaws_variant = std::variant<bylaws_v0>;

   struct bylaws_type
   {
      bylaws_variant value;
      EDEN_FORWARD_MEMBERS(value, type, text, time, approvals)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(bylaws_type, value)

   using bylaws_table_type = eosio::multi_index<"bylaws"_n, bylaws_type>;

   // There are at most 3 sets of bylaws tracked by the contract
   // - proposed: unilaterally set by the lead representative
   // - pending: 2/3+1 approval of proposed
   // - ratified: 2/3+1 approval of pending by a later board.
   //

   class bylaws
   {
     private:
      eosio::name contract;
      bylaws_table_type bylaws_tb;
      void approve(eosio::name current_state,
                   eosio::name next_state,
                   eosio::name approver,
                   const eosio::checksum256& proposal_hash);

     public:
      bylaws(eosio::name contract) : contract(contract), bylaws_tb(contract, default_scope) {}
      // Sets the current proposed bylaws
      void set_proposed(eosio::name proposer, const std::string& proposal);
      // Approves the current proposed bylaws
      void approve_proposed(eosio::name approver, const eosio::checksum256& proposal_hash);
      void approve_pending(eosio::name approver, const eosio::checksum256& proposal_hash);
      // Resets state at the beginning of a term.
      // - The proposed bylaws are cleared outright
      // - Approvals on the pending bylaws are cleared
      void new_board();
   };
}  // namespace eden
