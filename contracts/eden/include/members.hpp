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

   inline constexpr std::uint8_t not_in_election = 0;

   struct migrate_member_v0
   {
      uint64_t next_primary_key = 0;
      uint32_t migrate_some(eosio::name contract, uint32_t max_steps);
   };
   EOSIO_REFLECT(migrate_member_v0, next_primary_key)

   struct member_v0
   {
      eosio::name account;
      std::string name;
      member_status_type status;
      uint64_t nft_template_id;
      // Only reflected in v1
      uint8_t election_participation_status = 0;
      uint8_t election_rank = 0;
      eosio::name representative{uint64_t(-1)};
      std::optional<eosio::public_key> encryption_key;

      uint64_t primary_key() const { return account.value; }
      uint128_t by_representative() const
      {
         return (static_cast<uint128_t>(election_rank) << 64) | representative.value;
      }
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
      EDEN_FORWARD_FUNCTIONS(value, primary_key, by_representative)
   };
   EOSIO_REFLECT(member, value)

   using member_table_type = eosio::multi_index<
       "member"_n,
       member,
       eosio::indexed_by<"byrep"_n,
                         eosio::const_mem_fun<member, uint128_t, &member::by_representative>>>;

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
      void rename(eosio::name old_account, eosio::name new_account);
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
      bool can_upload_video(uint8_t round, eosio::name member);
      // Activates the contract if all genesis members are active
      void maybe_activate_contract();
      member_stats_v1 stats();

      // this method is used only for administrative purposes,
      // it should never be used outside genesis or test environments
      void clear_all();
   };

}  // namespace eden
