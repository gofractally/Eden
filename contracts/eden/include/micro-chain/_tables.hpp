#pragma once

#include <boost/multi_index/key.hpp>
#include <boost/multi_index/ordered_index.hpp>
#include <boost/multi_index_container.hpp>
#include "_types.hpp"

namespace micro_chain
{
   template <typename T, typename... Indexes>
   using mic = boost::multi_index_container<T,
                                            boost::multi_index::indexed_by<Indexes...>,
                                            chainbase::allocator<T>>;

   struct by_id;
   struct by_pk;
   struct by_invitee;
   struct by_group;
   struct by_round;
   struct by_createdAt;

   template <typename T>
   using ordered_by_id = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_id>,
       boost::multi_index::key<&T::id>>;

   template <typename T>
   using ordered_by_pk = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_pk>,
       boost::multi_index::key<&T::by_pk>>;

   template <typename T>
   using ordered_by_invitee = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_invitee>,
       boost::multi_index::key<&T::by_invitee>>;

   template <typename T>
   using ordered_by_group = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_group>,
       boost::multi_index::key<&T::by_group>>;

   template <typename T>
   using ordered_by_round = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_round>,
       boost::multi_index::key<&T::by_round>>;

   template <typename T>
   using ordered_by_createdAt = boost::multi_index::ordered_unique<  //
       boost::multi_index::tag<by_createdAt>,
       boost::multi_index::key<&T::by_createdAt>>;

   enum tables
   {
      status_table,
      balance_table,
      balance_history_table,
      induction_table,
      member_table,
      election_table,
      election_round_table,
      election_group_table,
      vote_table,
      distribution_table,
      distribution_fund_table,
   };

   struct status
   {
      bool active = false;
      std::string community;
      eosio::symbol communitySymbol;
      eosio::asset minimumDonation;
      std::vector<eosio::name> initialMembers;
      std::string genesisVideo;
      eden::atomicassets::attribute_map collectionAttributes;
      eosio::asset auctionStartingBid;
      uint32_t auctionDuration;
      std::string memo;
      eosio::block_timestamp nextElection;
      uint16_t electionThreshold = 0;
      uint16_t numElectionParticipants = 0;
   };

   struct status_object : public chainbase::object<status_table, status_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(status_object)

      id_type id;
      status status;
   };

   using status_index = mic<status_object, ordered_by_id<status_object>>;

   // Invariants:
   // * sum of amount across all balance records = 0
   // * token_account record holds negative of total tokens held
   //   in eden_account's balance in token_account contract
   // * pool_account() (LSBs = 0x0f) records hold pool funds
   // * distribution_fund record holds funds which are distributed, or in the middle
   //   of being distributed, but not yet spent
   struct balance_object : public chainbase::object<balance_table, balance_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(balance_object)

      id_type id;
      eosio::name account;
      eosio::asset amount;

      auto by_pk() const { return account; }
   };
   using balance_index =
       mic<balance_object, ordered_by_id<balance_object>, ordered_by_pk<balance_object>>;

   enum class history_desc
   {
      deposit,                     // incoming eosio::token
      withdraw,                    // outgoing eosio::token
      external_spend,              // non-contract spend of general funds
                                   //    e.g. powerup
                                   //    e.g. transfer before contract installed
      manual_transfer,             // manual spend of general funds (contract's transfer action)
      fund_transfer,               // fundtransfer action
      user_transfer,               // usertransfer action
      fund,                        // received general funds from external source
      donate,                      // user donated to general fund
      inductdonate,                // user donated to general fund during induction
      reserve_distribution,        // reserve funds for distribution
      return_excess_distribution,  // return excess distribution funds to pool
      return_distribution,         // return distribution funds to pool. e.g. member resigns
   };

   const char* history_desc_str[] = {
       "deposit",                     //
       "withdraw",                    //
       "external spend",              //
       "manual transfer",             //
       "fund transfer",               //
       "user transfer",               //
       "fund",                        //
       "donate",                      //
       "inductdonate",                //
       "reserve distribution",        //
       "return excess distribution",  //
       "return distribution",         //
   };

   using balance_history_key = std::tuple<eosio::name, eosio::block_timestamp, uint64_t>;

   // Invariants:
   // * All records have a twin with account and other_account swapped, and with delta = -delta
   // * The sum of deltas for an account match the balance_object for that account
   struct balance_history_object
       : public chainbase::object<balance_history_table, balance_history_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(balance_history_object)

      id_type id;
      eosio::block_timestamp time;
      eosio::name account;
      eosio::asset delta;
      eosio::asset new_amount;
      eosio::name other_account;
      history_desc description;

      balance_history_key by_pk() const { return {account, time, id._id}; }
   };
   using balance_history_index = mic<balance_history_object,
                                     ordered_by_id<balance_history_object>,
                                     ordered_by_pk<balance_history_object>>;

   struct induction
   {
      uint64_t id = 0;
      eosio::name inviter;
      eosio::name invitee;
      std::vector<eosio::name> witnesses;
      eden::new_member_profile profile;
      std::string video;
   };
   EOSIO_REFLECT(induction, id, inviter, invitee, witnesses, profile, video)

   struct induction_object : public chainbase::object<induction_table, induction_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(induction_object)

      id_type id;
      induction induction;

      uint64_t by_pk() const { return induction.id; }
      std::pair<eosio::name, uint64_t> by_invitee() const
      {
         return {induction.invitee, induction.id};
      }
   };
   using induction_index = mic<induction_object,
                               ordered_by_id<induction_object>,
                               ordered_by_pk<induction_object>,
                               ordered_by_invitee<induction_object>>;

   using MemberCreatedAtKey = std::pair<eosio::block_timestamp, eosio::name>;

   struct member
   {
      eosio::name account;
      eosio::name inviter;
      std::vector<eosio::name> inductionWitnesses;
      eden::new_member_profile profile;
      std::string inductionVideo;
      bool participating = false;
      eosio::block_timestamp createdAt;
   };

   struct member_object : public chainbase::object<member_table, member_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(member_object)

      id_type id;
      member member;

      eosio::name by_pk() const { return member.account; }
      MemberCreatedAtKey by_createdAt() const { return {member.createdAt, member.account}; }
   };
   using member_index = mic<member_object,
                            ordered_by_id<member_object>,
                            ordered_by_pk<member_object>,
                            ordered_by_createdAt<member_object>>;

   struct election_object : public chainbase::object<election_table, election_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(election_object)

      id_type id;
      eosio::block_timestamp time;
      bool seeding = false;
      bool results_available = false;
      std::optional<eosio::block_timestamp> seeding_start_time;
      std::optional<eosio::block_timestamp> seeding_end_time;
      std::optional<eosio::checksum256> seed;
      std::optional<uint8_t> num_rounds;
      std::optional<uint16_t> num_participants;
      std::optional<uint64_t> final_group_id;

      auto by_pk() const { return time; }
   };
   using election_index =
       mic<election_object, ordered_by_id<election_object>, ordered_by_pk<election_object>>;

   using ElectionRoundKey = std::tuple<eosio::block_timestamp, uint8_t>;

   struct election_round_object
       : public chainbase::object<election_round_table, election_round_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(election_round_object)

      id_type id;
      eosio::block_timestamp election_time;
      uint8_t round = 0;
      uint16_t num_participants = 0;
      uint16_t num_groups = 0;
      bool requires_voting = false;
      bool groups_available = false;
      bool voting_started = false;
      bool voting_finished = false;
      bool results_available = false;
      std::optional<eosio::block_timestamp> voting_begin;
      std::optional<eosio::block_timestamp> voting_end;

      ElectionRoundKey by_round() const { return {election_time, round}; }
   };
   using election_round_index = mic<election_round_object,
                                    ordered_by_id<election_round_object>,
                                    ordered_by_round<election_round_object>>;

   using ElectionGroupKey = std::tuple<eosio::block_timestamp, uint8_t, eosio::name>;
   using ElectionGroupByRoundKey = std::tuple<eosio::block_timestamp, uint8_t, uint64_t>;

   struct election_group_object
       : public chainbase::object<election_group_table, election_group_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(election_group_object)

      id_type id;
      eosio::block_timestamp election_time;
      uint8_t round;
      eosio::name first_member;
      eosio::name winner;

      ElectionGroupKey by_pk() const { return {election_time, round, first_member}; }
      ElectionGroupByRoundKey by_round() const { return {election_time, round, id._id}; }
   };
   using election_group_index = mic<election_group_object,
                                    ordered_by_id<election_group_object>,
                                    ordered_by_pk<election_group_object>,
                                    ordered_by_round<election_group_object>>;

   using vote_key = std::tuple<eosio::name, eosio::block_timestamp, uint8_t>;

   struct vote_object : public chainbase::object<vote_table, vote_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(vote_object)

      id_type id;
      eosio::block_timestamp election_time;
      uint8_t round;
      uint64_t group_id;
      eosio::name voter;
      eosio::name candidate;
      std::string video;

      vote_key by_pk() const { return {voter, election_time, round}; }
      auto by_group() const { return std::tuple{group_id, voter}; }
   };
   using vote_index = mic<vote_object,
                          ordered_by_id<vote_object>,
                          ordered_by_pk<vote_object>,
                          ordered_by_group<vote_object>>;

   struct distribution_object : public chainbase::object<distribution_table, distribution_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(distribution_object)

      id_type id;
      eosio::block_timestamp time;
      bool started = false;
      std::optional<eosio::asset> target_amount;
      std::optional<std::vector<eosio::asset>> target_rank_distribution;

      auto by_pk() const { return time; }
   };
   using distribution_index = mic<distribution_object,
                                  ordered_by_id<distribution_object>,
                                  ordered_by_pk<distribution_object>>;

   using distribution_fund_key = std::tuple<eosio::name, eosio::block_timestamp, uint8_t>;

   struct distribution_fund_object
       : public chainbase::object<distribution_fund_table, distribution_fund_object>
   {
      CHAINBASE_DEFAULT_CONSTRUCTOR(distribution_fund_object)

      id_type id;
      eosio::name owner;
      eosio::block_timestamp distribution_time;
      uint8_t rank;
      eosio::asset initial_balance;
      eosio::asset current_balance;

      distribution_fund_key by_pk() const { return {owner, distribution_time, rank}; }
   };
   using distribution_fund_index = mic<distribution_fund_object,
                                       ordered_by_id<distribution_fund_object>,
                                       ordered_by_pk<distribution_fund_object>>;

   struct database
   {
      chainbase::database db;
      chainbase::generic_index<status_index> status;
      chainbase::generic_index<balance_index> balances;
      chainbase::generic_index<balance_history_index> balance_history;
      chainbase::generic_index<induction_index> inductions;
      chainbase::generic_index<member_index> members;
      chainbase::generic_index<election_index> elections;
      chainbase::generic_index<election_round_index> election_rounds;
      chainbase::generic_index<election_group_index> election_groups;
      chainbase::generic_index<vote_index> votes;
      chainbase::generic_index<distribution_index> distributions;
      chainbase::generic_index<distribution_fund_index> distribution_funds;

      database()
      {
         db.add_index(status);
         db.add_index(balances);
         db.add_index(balance_history);
         db.add_index(inductions);
         db.add_index(members);
         db.add_index(elections);
         db.add_index(election_rounds);
         db.add_index(election_groups);
         db.add_index(votes);
         db.add_index(distributions);
         db.add_index(distribution_funds);
      }
   };
   database db;

   uint64_t available_pk(const auto& table, const auto& first)
   {
      auto& idx = table.template get<by_pk>();
      if (idx.empty())
         return first;
      return (--idx.end())->by_pk() + 1;
   }

   template <typename Tag, typename Table, typename Key, typename F>
   void add_or_modify(Table& table, const Key& key, F&& f)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      if (it != idx.end())
         table.modify(*it, [&](auto& obj) { return f(false, obj); });
      else
         table.emplace([&](auto& obj) { return f(true, obj); });
   }

   template <typename Tag, typename Table, typename Key, typename F>
   void add_or_replace(Table& table, const Key& key, F&& f)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      if (it != idx.end())
         table.remove(*it);
      table.emplace(f);
   }

   template <typename Tag, typename Table, typename Key, typename F>
   void modify(Table& table, const Key& key, F&& f)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      eosio::check(it != idx.end(), "missing record");
      table.modify(*it, [&](auto& obj) { return f(obj); });
   }

   template <typename Tag, typename Table, typename Key>
   void remove_if_exists(Table& table, const Key& key)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      if (it != idx.end())
         table.remove(*it);
   }

   template <typename Tag, typename Table, typename Key>
   const auto& get(Table& table, const Key& key)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      eosio::check(it != idx.end(), "missing record");
      return *it;
   }

   template <typename Tag, typename Table, typename Key>
   const typename Table::value_type* get_ptr(Table& table, const Key& key)
   {
      auto& idx = table.template get<Tag>();
      auto it = idx.find(key);
      if (it == idx.end())
         return nullptr;
      return &*it;
   }
}  // namespace micro_chain