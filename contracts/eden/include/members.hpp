#pragma once

#include <constants.hpp>
#include <encrypt.hpp>
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

   using election_participation_status_type = uint8_t;
   enum election_participation_status : election_participation_status_type
   {
      no_donation,
      in_election,
      not_in_election,
      recently_inducted
   };

   struct member_v0
   {
      eosio::name account;
      std::string name;
      member_status_type status;
      uint64_t nft_template_id;
      // Only reflected in v1
      election_participation_status_type election_participation_status = in_election;
      uint8_t election_rank = 0;
      eosio::name representative{uint64_t(-1)};
      std::optional<eosio::public_key> encryption_key;

      uint64_t primary_key() const { return account.value; }
   };
   EOSIO_REFLECT(member_v0, account, name, status, nft_template_id)

   // - A member can donate at any time after the end of a scheduled election and before
   //   the start of the next scheduled election.
   // - A member who does not make a donation before the election starts will be deactivated.
   //
   struct member_v1 : member_v0
   {
   };
   EOSIO_REFLECT(member_v1,
                 base member_v0,
                 election_participation_status,
                 election_rank,
                 representative,
                 encryption_key);

   using member_variant = std::variant<member_v0, member_v1>;

   struct member
   {
      member_variant value;
      EDEN_FORWARD_MEMBERS(value,
                           account,
                           name,
                           status,
                           nft_template_id,
                           election_participation_status,
                           election_rank,
                           representative,
                           encryption_key);
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

   struct member_stats_v1 : member_stats_v0
   {
      std::vector<uint16_t> ranks;
   };
   EOSIO_REFLECT(member_stats_v1, base member_stats_v0, ranks)

   using member_stats_variant = std::variant<member_stats_v0, member_stats_v1>;
   using member_stats_singleton = eosio::singleton<"memberstats"_n, member_stats_variant>;

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

      const member_table_type& get_table() const { return member_tb; }
      const member& get_member(eosio::name account);
      void create(eosio::name account);
      member_table_type::const_iterator erase(member_table_type::const_iterator iter);
      void remove(eosio::name account);
      void remove_if_pending(eosio::name account);
      bool is_new_member(eosio::name account) const;
      void check_active_member(eosio::name account);
      void check_pending_member(eosio::name account);
      void check_keys(const std::vector<eosio::name>& accounts,
                      const std::vector<encrypted_key>& keys);
      void set_key(eosio::name member, const eosio::public_key& key);
      void deposit(eosio::name account, const eosio::asset& quantity);
      void set_nft(eosio::name account, int32_t nft_template_id);
      void set_active(eosio::name account, const std::string& name);
      void clear_ranks();
      void set_rank(eosio::name account, uint8_t rank, eosio::name representative);
      void election_opt(const member& member, bool participating);
      // Activates the contract if all genesis members are active
      void maybe_activate_contract();
      member_stats_v1 stats();

      // this method is used only for administrative purposes,
      // it should never be used outside genesis or test environments
      void clear_all();
   };

}  // namespace eden
