#include <accounts.hpp>
#include <boost/multi_index/key.hpp>
#include <boost/multi_index/ordered_index.hpp>
#include <boost/multi_index_container.hpp>
#include <chainbase/chainbase.hpp>
#include <clchain/crypto.hpp>
#include <clchain/graphql_connection.hpp>
#include <clchain/subchain.hpp>
#include <eden.hpp>
#include <eosio/abi.hpp>
#include <eosio/from_bin.hpp>
#include <eosio/to_bin.hpp>
#include <eosio/ship_protocol.hpp>
#include <events.hpp>

using namespace eosio::literals;

eosio::name eden_account;
eosio::name token_account;
eosio::name atomic_account;
eosio::name atomicmarket_account;

constexpr eosio::name pool_account(eosio::name pool)
{
   return eosio::name{pool.value | 0x0f};
}
constexpr eosio::name master_pool = pool_account("master"_n);
eosio::name distribution_fund;

const eosio::name account_min = eosio::name{0}; 
const eosio::name account_max = eosio::name{~uint64_t(0)}; 
const eosio::block_timestamp block_timestamp_min = eosio::block_timestamp{0}; 
const eosio::block_timestamp block_timestamp_max = eosio::block_timestamp{~uint32_t(0)}; 

// TODO: switch to uint64_t (js BigInt) after we upgrade to nodejs >= 15
extern "C" void __wasm_call_ctors();
[[clang::export_name("initialize")]] void initialize(uint32_t eden_account_low,
                                                     uint32_t eden_account_high,
                                                     uint32_t token_account_low,
                                                     uint32_t token_account_high,
                                                     uint32_t atomic_account_low,
                                                     uint32_t atomic_account_high,
                                                     uint32_t atomicmarket_account_low,
                                                     uint32_t atomicmarket_account_high)
{
   __wasm_call_ctors();
   eden_account.value = (uint64_t(eden_account_high) << 32) | eden_account_low;
   token_account.value = (uint64_t(token_account_high) << 32) | token_account_low;
   atomic_account.value = (uint64_t(atomic_account_high) << 32) | atomic_account_low;
   atomicmarket_account.value =
       (uint64_t(atomicmarket_account_high) << 32) | atomicmarket_account_low;

   distribution_fund.value = eden_account.value + 1;
}

[[clang::export_name("allocateMemory")]] void* allocateMemory(uint32_t size)
{
   return malloc(size);
}
[[clang::export_name("freeMemory")]] void freeMemory(void* p)
{
   free(p);
}

std::variant<std::string, std::vector<char>> result;
[[clang::export_name("getResultSize")]] uint32_t getResultSize()
{
   return std::visit([](auto& data) { return data.size(); }, result);
}
[[clang::export_name("getResult")]] const char* getResult()
{
   return std::visit([](auto& data) { return data.data(); }, result);
}

template <typename T>
void dump(const T& ind)
{
   printf("%s\n", eosio::format_json(ind).c_str());
}

namespace boost
{
   BOOST_NORETURN void throw_exception(std::exception const& e)
   {
      eosio::detail::assert_or_throw(e.what());
   }
   BOOST_NORETURN void throw_exception(std::exception const& e, boost::source_location const& loc)
   {
      eosio::detail::assert_or_throw(e.what());
   }
}  // namespace boost

struct by_id;
struct by_pk;
struct by_invitee;
struct by_group;
struct by_round;
struct by_createdAt;
struct by_member;
struct by_owner;

template <typename T, typename... Indexes>
using mic = boost::
    multi_index_container<T, boost::multi_index::indexed_by<Indexes...>, chainbase::allocator<T>>;

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

template <typename T>
using ordered_by_member = boost::multi_index::ordered_unique<  //
    boost::multi_index::tag<by_member>,
    boost::multi_index::key<&T::by_member>>;

template <typename T>
using ordered_by_owner = boost::multi_index::ordered_unique<  //
    boost::multi_index::tag<by_owner>,
    boost::multi_index::key<&T::by_owner>>;

uint64_t available_pk(const auto& table, const auto& first)
{
   auto& idx = table.template get<by_pk>();
   if (idx.empty())
      return first;
   return (--idx.end())->by_pk() + 1;
}

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
   nft_table,
};

struct MemberElection;
constexpr const char MemberElectionConnection_name[] = "MemberElectionConnection";
constexpr const char MemberElectionEdge_name[] = "MemberElectionEdge";
using MemberElectionConnection =
    clchain::Connection<clchain::ConnectionConfig<MemberElection,
                                                  MemberElectionConnection_name,
                                                  MemberElectionEdge_name>>;

struct Vote;
using vote_key = std::tuple<eosio::name, eosio::block_timestamp, uint8_t>;
constexpr const char VoteConnection_name[] = "VoteConnection";
constexpr const char VoteEdge_name[] = "VoteEdge";
using VoteConnection =
    clchain::Connection<clchain::ConnectionConfig<Vote, VoteConnection_name, VoteEdge_name>>;

struct DistributionFund;
constexpr const char DistributionFundConnection_name[] = "DistributionFundConnection";
constexpr const char DistributionFundEdge_name[] = "DistributionFundEdge";
using DistributionFundConnection =
    clchain::Connection<clchain::ConnectionConfig<DistributionFund,
                                                  DistributionFundConnection_name,
                                                  DistributionFundEdge_name>>;

struct Nft;
constexpr const char NftConnection_name[] = "NftConnection";
constexpr const char NftEdge_name[] = "NftEdge";
using NftConnection =
    clchain::Connection<clchain::ConnectionConfig<Nft,
                                                  NftConnection_name,
                                                  NftEdge_name>>;

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
   std::pair<eosio::name, uint64_t> by_invitee() const { return {induction.invitee, induction.id}; }
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
   MemberCreatedAtKey by_createdAt() const { 
      return {member.createdAt, member.account}; 
   }
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

struct election_round_object : public chainbase::object<election_round_table, election_round_object>
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

struct election_group_object : public chainbase::object<election_group_table, election_group_object>
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

using nft_account_key = std::tuple<eosio::name, eosio::block_timestamp, uint64_t>;

struct nft_object
    : public chainbase::object<nft_table, nft_object>
{
   CHAINBASE_DEFAULT_CONSTRUCTOR(nft_object)

   id_type id;
   eosio::name member;
   eosio::name owner;
   int32_t templateId;
   uint64_t assetId;
   uint32_t templateMint;
   eosio::block_timestamp createdAt;

   auto by_pk() const { return assetId; }
   nft_account_key by_member() const { return {member, createdAt, assetId}; }
   nft_account_key by_owner() const { return {owner, createdAt, assetId}; }
};
using nft_index = mic<nft_object,
                      ordered_by_id<nft_object>,
                      ordered_by_pk<nft_object>,
                      ordered_by_member<nft_object>,
                      ordered_by_owner<nft_object>>;


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
   chainbase::generic_index<nft_index> nfts;

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
      db.add_index(nfts);
   }
};
database db;

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

const auto& get_status()
{
   auto& idx = db.status.get<by_id>();
   eosio::check(idx.size() == 1, "missing genesis action");
   return *idx.begin();
}

struct Member;
std::optional<Member> get_member(eosio::name account, bool allow_lsb = false);
std::vector<Member> get_members(const std::vector<eosio::name>& v);

struct BalanceHistory;
constexpr const char BalanceHistoryConnection_name[] = "BalanceHistoryConnection";
constexpr const char BalanceHistoryEdge_name[] = "BalanceHistoryEdge";
using BalanceHistoryConnection =
    clchain::Connection<clchain::ConnectionConfig<BalanceHistory,
                                                  BalanceHistoryConnection_name,
                                                  BalanceHistoryEdge_name>>;

struct Balance
{
   eosio::name _account;
   const balance_object* obj;

   Member account() const;
   std::optional<eosio::asset> amount() const
   {
      return obj ? std::optional{obj->amount} : std::nullopt;
   }
   BalanceHistoryConnection history(std::optional<eosio::block_timestamp> gt,
                                    std::optional<eosio::block_timestamp> ge,
                                    std::optional<eosio::block_timestamp> lt,
                                    std::optional<eosio::block_timestamp> le,
                                    std::optional<uint32_t> first,
                                    std::optional<uint32_t> last,
                                    std::optional<std::string> before,
                                    std::optional<std::string> after) const;
};
EOSIO_REFLECT2(Balance,
               account,
               amount,
               method(history, "gt", "ge", "lt", "le", "first", "last", "before", "after"))

constexpr const char BalanceConnection_name[] = "BalanceConnection";
constexpr const char BalanceEdge_name[] = "BalanceEdge";
using BalanceConnection = clchain::Connection<
    clchain::ConnectionConfig<Balance, BalanceConnection_name, BalanceEdge_name>>;

Balance get_balance(eosio::name account)
{
   if (auto* obj = get_ptr<by_pk>(db.balances, account))
      return Balance{account, obj};
   else
      return Balance{account, nullptr};
}

struct BalanceHistory
{
   const balance_history_object* obj;

   eosio::block_timestamp time() const { return obj->time; }
   Balance balance() const { return get_balance(obj->account); }
   eosio::asset delta() const { return obj->delta; }
   eosio::asset newAmount() const { return obj->new_amount; }
   Balance otherBalance() const { return get_balance(obj->other_account); }
   std::string description() const { return history_desc_str[(int)obj->description]; }
};
EOSIO_REFLECT2(BalanceHistory, time, balance, delta, newAmount, otherBalance, description)

BalanceHistoryConnection Balance::history(std::optional<eosio::block_timestamp> gt,
                                          std::optional<eosio::block_timestamp> ge,
                                          std::optional<eosio::block_timestamp> lt,
                                          std::optional<eosio::block_timestamp> le,
                                          std::optional<uint32_t> first,
                                          std::optional<uint32_t> last,
                                          std::optional<std::string> before,
                                          std::optional<std::string> after) const
{
   return clchain::make_connection<BalanceHistoryConnection, balance_history_key>(
       gt ? std::optional{balance_history_key{_account, *gt, ~uint64_t(0)}}              //
          : std::nullopt,                                                                //
       ge ? std::optional{balance_history_key{_account, *ge, 0}}                         //
          : std::optional{balance_history_key{_account, eosio::block_timestamp{0}, 0}},  //
       lt ? std::optional{balance_history_key{_account, *lt, 0}}                         //
          : std::nullopt,                                                                //
       le ? std::optional{balance_history_key{_account, *le, ~uint64_t(0)}}              //
          : std::optional{balance_history_key{_account, eosio::block_timestamp::max(),   //
                                              ~uint64_t(0)}},                            //
       first, last, before, after,                                                       //
       db.balance_history.get<by_pk>(),                                                  //
       [](auto& obj) { return obj.by_pk(); },                                            //
       [&](auto& obj) { return BalanceHistory{&obj}; },
       [](auto& balance_history, auto key) { return balance_history.lower_bound(key); },
       [](auto& balance_history, auto key) { return balance_history.upper_bound(key); });
}

struct Member
{
   eosio::name account;
   const member* member;

   auto balance() const { return get_balance(account); }
   auto inviter() const { return get_member(member ? member->inviter : ""_n); }
   std::optional<std::vector<Member>> inductionWitnesses() const
   {
      return member ? std::optional{get_members(member->inductionWitnesses)} : std::nullopt;
   }
   const eden::new_member_profile* profile() const { return member ? &member->profile : nullptr; }
   const std::string* inductionVideo() const { return member ? &member->inductionVideo : nullptr; }
   bool participating() const { return member && member->participating; }
   eosio::block_timestamp createdAt() const { return member->createdAt; }
   
   NftConnection nfts(std::optional<eosio::block_timestamp> gt,
                      std::optional<eosio::block_timestamp> ge,
                      std::optional<eosio::block_timestamp> lt,
                      std::optional<eosio::block_timestamp> le,
                      std::optional<uint32_t> first,
                      std::optional<uint32_t> last,
                      std::optional<std::string> before,
                      std::optional<std::string> after) const;

   NftConnection collectedNfts(std::optional<eosio::block_timestamp> gt,
                               std::optional<eosio::block_timestamp> ge,
                               std::optional<eosio::block_timestamp> lt,
                               std::optional<eosio::block_timestamp> le,
                               std::optional<uint32_t> first,
                               std::optional<uint32_t> last,
                               std::optional<std::string> before,
                               std::optional<std::string> after) const;

   MemberElectionConnection elections(std::optional<eosio::block_timestamp> gt,
                                      std::optional<eosio::block_timestamp> ge,
                                      std::optional<eosio::block_timestamp> lt,
                                      std::optional<eosio::block_timestamp> le,
                                      std::optional<uint32_t> first,
                                      std::optional<uint32_t> last,
                                      std::optional<std::string> before,
                                      std::optional<std::string> after) const;
   DistributionFundConnection distributionFunds(std::optional<eosio::block_timestamp> gt,
                                                std::optional<eosio::block_timestamp> ge,
                                                std::optional<eosio::block_timestamp> lt,
                                                std::optional<eosio::block_timestamp> le,
                                                std::optional<uint32_t> first,
                                                std::optional<uint32_t> last,
                                                std::optional<std::string> before,
                                                std::optional<std::string> after) const;
};
EOSIO_REFLECT2(
    Member,
    account,
    balance,
    inviter,
    inductionWitnesses,
    profile,
    inductionVideo,
    participating,
    createdAt,
    method(nfts, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
    method(collectedNfts, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
    method(elections, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
    method(distributionFunds, "gt", "ge", "lt", "le", "first", "last", "before", "after"))

std::optional<Member> get_member(eosio::name account, bool allow_lsb)
{
   if (auto* member_object = get_ptr<by_pk>(db.members, account))
      return Member{account, &member_object->member};
   else if (account.value && (!(account.value & 0x0f) || allow_lsb))
      return Member{account, nullptr};
   else
      return std::nullopt;
}

std::vector<Member> get_members(const std::vector<eosio::name>& v)
{
   std::vector<Member> result;
   result.reserve(v.size());
   for (auto n : v)
   {
      auto m = get_member(n);
      if (m)
         result.push_back(*m);
   }
   return result;
}

Member Balance::account() const
{
   return *get_member(_account, true);
}

struct Status
{
   const status* status;

   bool active() const { return status->active; }
   const std::string& community() const { return status->community; }
   const eosio::symbol& communitySymbol() const { return status->communitySymbol; }
   const eosio::asset& minimumDonation() const { return status->minimumDonation; }
   auto initialMembers() const { return get_members(status->initialMembers); }
   const std::string& genesisVideo() const { return status->genesisVideo; }
   const eosio::asset& auctionStartingBid() const { return status->auctionStartingBid; }
   uint32_t auctionDuration() const { return status->auctionDuration; }
   const std::string& memo() const { return status->memo; }
   const eosio::block_timestamp& nextElection() const { return status->nextElection; }
   uint16_t electionThreshold() const { return status->electionThreshold; }
   uint16_t numElectionParticipants() const { return status->numElectionParticipants; }
};
EOSIO_REFLECT2(Status,
               active,
               community,
               initialMembers,
               genesisVideo,
               auctionDuration,
               memo,
               nextElection,
               electionThreshold,
               numElectionParticipants)

struct ElectionRound;
constexpr const char ElectionRoundConnection_name[] = "ElectionRoundConnection";
constexpr const char ElectionRoundEdge_name[] = "ElectionRoundEdge";
using ElectionRoundConnection = clchain::Connection<
    clchain::ConnectionConfig<ElectionRound, ElectionRoundConnection_name, ElectionRoundEdge_name>>;

struct ElectionGroup;
constexpr const char ElectionGroupConnection_name[] = "ElectionGroupConnection";
constexpr const char ElectionGroupEdge_name[] = "ElectionGroupEdge";
using ElectionGroupConnection = clchain::Connection<
    clchain::ConnectionConfig<ElectionGroup, ElectionGroupConnection_name, ElectionGroupEdge_name>>;

struct Election
{
   const election_object* obj;

   eosio::block_timestamp time() const { return obj->time; }
   bool seeding() const { return obj->seeding; }
   bool resultsAvailable() const { return obj->results_available; }
   std::optional<eosio::block_timestamp> seedingStartTime() const
   {
      return obj->seeding_start_time;
   }
   std::optional<eosio::block_timestamp> seedingEndTime() const { return obj->seeding_end_time; }
   std::optional<eosio::checksum256> seed() const { return obj->seed; }
   std::optional<uint8_t> numRounds() const { return obj->num_rounds; }
   std::optional<uint16_t> numParticipants() const { return obj->num_participants; }

   ElectionRoundConnection rounds(std::optional<uint8_t> gt,
                                  std::optional<uint8_t> ge,
                                  std::optional<uint8_t> lt,
                                  std::optional<uint8_t> le,
                                  std::optional<uint32_t> first,
                                  std::optional<uint32_t> last,
                                  std::optional<std::string> before,
                                  std::optional<std::string> after) const;
   std::optional<ElectionGroup> finalGroup() const;
};
EOSIO_REFLECT2(Election,
               time,
               seeding,
               resultsAvailable,
               seedingStartTime,
               seedingEndTime,
               seed,
               numRounds,
               numParticipants,
               method(rounds, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
               finalGroup)

struct MemberElection
{
   eosio::name account;
   const election_object* election;

   eosio::block_timestamp time() const { return election->time; }

   VoteConnection votes(std::optional<uint32_t> first,
                        std::optional<uint32_t> last,
                        std::optional<std::string> before,
                        std::optional<std::string> after) const;
};
EOSIO_REFLECT2(MemberElection, time, method(votes, "first", "last", "before", "after"))

MemberElectionConnection Member::elections(std::optional<eosio::block_timestamp> gt,
                                           std::optional<eosio::block_timestamp> ge,
                                           std::optional<eosio::block_timestamp> lt,
                                           std::optional<eosio::block_timestamp> le,
                                           std::optional<uint32_t> first,
                                           std::optional<uint32_t> last,
                                           std::optional<std::string> before,
                                           std::optional<std::string> after) const
{
   return clchain::make_connection<MemberElectionConnection, eosio::block_timestamp>(
       gt, ge, lt, le, first, last, before, after,  //
       db.elections.get<by_pk>(),                   //
       [](auto& obj) { return obj.time; },          //
       [&](auto& obj) {
          return MemberElection{account, &obj};
       },
       [](auto& elections, auto key) { return elections.lower_bound(key); },
       [](auto& elections, auto key) { return elections.upper_bound(key); });
}

struct ElectionRound
{
   const election_round_object* obj;

   Election election() const { return {&get<by_pk>(db.elections, obj->election_time)}; }
   uint8_t round() const { return obj->round; }
   uint16_t numParticipants() const { return obj->num_participants; }
   uint16_t numGroups() const { return obj->num_groups; }
   bool requiresVoting() const { return obj->requires_voting; }
   bool groupsAvailable() const { return obj->groups_available; }
   bool votingStarted() const { return obj->voting_started; }
   bool votingFinished() const { return obj->voting_finished; }
   bool resultsAvailable() const { return obj->results_available; }
   const std::optional<eosio::block_timestamp>& votingBegin() const { return obj->voting_begin; }
   const std::optional<eosio::block_timestamp>& votingEnd() const { return obj->voting_end; }

   ElectionGroupConnection groups(std::optional<uint32_t> first,
                                  std::optional<uint32_t> last,
                                  std::optional<std::string> before,
                                  std::optional<std::string> after) const;
};
EOSIO_REFLECT2(ElectionRound,
               election,
               round,
               numParticipants,
               numGroups,
               requiresVoting,
               groupsAvailable,
               votingStarted,
               votingFinished,
               resultsAvailable,
               votingBegin,
               votingEnd,
               method(groups, "first", "last", "before", "after"))

ElectionRoundConnection Election::rounds(std::optional<uint8_t> gt,
                                         std::optional<uint8_t> ge,
                                         std::optional<uint8_t> lt,
                                         std::optional<uint8_t> le,
                                         std::optional<uint32_t> first,
                                         std::optional<uint32_t> last,
                                         std::optional<std::string> before,
                                         std::optional<std::string> after) const
{
   return clchain::make_connection<ElectionRoundConnection, ElectionRoundKey>(
       gt ? std::optional{ElectionRoundKey{obj->time, *gt}}           //
          : std::nullopt,                                             //
       ge ? std::optional{ElectionRoundKey{obj->time, *ge}}           //
          : std::optional{ElectionRoundKey{obj->time, 0}},            //
       lt ? std::optional{ElectionRoundKey{obj->time, *lt}}           //
          : std::nullopt,                                             //
       le ? std::optional{ElectionRoundKey{obj->time, *le}}           //
          : std::optional{ElectionRoundKey{obj->time, ~uint8_t(0)}},  //
       first, last, before, after,                                    //
       db.election_rounds.get<by_round>(),                            //
       [](auto& obj) { return obj.by_round(); },                      //
       [](auto& obj) { return ElectionRound{&obj}; },
       [](auto& rounds, auto key) { return rounds.lower_bound(key); },
       [](auto& rounds, auto key) { return rounds.upper_bound(key); });
}

struct ElectionGroup
{
   const election_group_object* obj;

   Election election() const { return {&get<by_pk>(db.elections, obj->election_time)}; }
   ElectionRound round() const
   {
      return {&get<by_round>(db.election_rounds, ElectionRoundKey{obj->election_time, obj->round})};
   }
   auto winner() const { return get_member(obj->winner); }
   std::vector<Vote> votes() const;
};
EOSIO_REFLECT2(ElectionGroup, election, round, winner, votes)

ElectionGroupConnection ElectionRound::groups(std::optional<uint32_t> first,
                                              std::optional<uint32_t> last,
                                              std::optional<std::string> before,
                                              std::optional<std::string> after) const
{
   return clchain::make_connection<ElectionGroupConnection, ElectionGroupByRoundKey>(
       std::nullopt,                                                                          // gt
       std::optional{ElectionGroupByRoundKey{obj->election_time, obj->round, 0}},             // ge
       std::nullopt,                                                                          // lt
       std::optional{ElectionGroupByRoundKey{obj->election_time, obj->round, ~uint64_t(0)}},  // le
       first, last, before, after,                                                            //
       db.election_groups.get<by_round>(),                                                    //
       [](auto& obj) { return obj.by_round(); },                                              //
       [](auto& obj) { return ElectionGroup{&obj}; },
       [](auto& groups, auto key) { return groups.lower_bound(key); },
       [](auto& groups, auto key) { return groups.upper_bound(key); });
}

std::optional<ElectionGroup> Election::finalGroup() const
{
   if (obj->final_group_id)
      return ElectionGroup{&get<by_id>(db.election_groups, *obj->final_group_id)};
   return std::nullopt;
}

struct Vote
{
   const vote_object* obj;

   auto voter() const { return get_member(obj->voter); }
   auto candidate() const { return get_member(obj->candidate); }
   const auto& video() const { return obj->video; }
   auto group() const { return ElectionGroup{&get<by_id>(db.election_groups, obj->group_id)}; }
};
EOSIO_REFLECT2(Vote, voter, candidate, video, group)

std::vector<Vote> ElectionGroup::votes() const
{
   std::vector<Vote> result;
   auto& idx = db.votes.get<by_group>();
   for (auto it = idx.lower_bound(std::tuple{obj->id._id, eosio::name{0}});
        it != idx.end() && it->group_id == obj->id._id; ++it)
   {
      result.push_back(Vote{&*it});
   }
   return result;
}

VoteConnection MemberElection::votes(std::optional<uint32_t> first,
                                     std::optional<uint32_t> last,
                                     std::optional<std::string> before,
                                     std::optional<std::string> after) const
{
   return clchain::make_connection<VoteConnection, vote_key>(
       std::nullopt,                                    // gt
       vote_key{account, election->time, 0},            // ge
       std::nullopt,                                    // lt
       vote_key{account, election->time, ~uint8_t(0)},  // le
       first, last, before, after,                      //
       db.votes.get<by_pk>(),                           //
       [](auto& obj) { return obj.by_pk(); },           //
       [](auto& obj) { return Vote{&obj}; },            //
       [](auto& votes, auto key) { return votes.lower_bound(key); },
       [](auto& votes, auto key) { return votes.upper_bound(key); });
}

struct Distribution
{
   const distribution_object* obj;

   auto time() const { return obj->time; }
   bool started() const { return obj->started; }
   const auto& targetAmount() const { return obj->target_amount; }
   const auto& targetRankDistribution() const { return obj->target_rank_distribution; }
};
EOSIO_REFLECT2(Distribution, time, started, targetAmount, targetRankDistribution)

struct DistributionFund
{
   const distribution_fund_object* obj;

   auto owner() const { return get_member(obj->owner); }
   auto distributionTime() const { return obj->distribution_time; }
   auto rank() const { return obj->rank; }
   const auto& initialBalance() const { return obj->initial_balance; }
   const auto& currentBalance() const { return obj->current_balance; }
};
EOSIO_REFLECT2(DistributionFund, owner, distributionTime, rank, initialBalance, currentBalance)

DistributionFundConnection Member::distributionFunds(std::optional<eosio::block_timestamp> gt,
                                                     std::optional<eosio::block_timestamp> ge,
                                                     std::optional<eosio::block_timestamp> lt,
                                                     std::optional<eosio::block_timestamp> le,
                                                     std::optional<uint32_t> first,
                                                     std::optional<uint32_t> last,
                                                     std::optional<std::string> before,
                                                     std::optional<std::string> after) const
{
   return clchain::make_connection<DistributionFundConnection, distribution_fund_key>(
       gt ? std::optional{distribution_fund_key{account, *gt, ~uint8_t(0)}}               //
          : std::nullopt,                                                                 //
       ge ? std::optional{distribution_fund_key{account, *ge, 0}}                         //
          : std::optional{distribution_fund_key{account, eosio::block_timestamp{0}, 0}},  //
       lt ? std::optional{distribution_fund_key{account, *lt, 0}}                         //
          : std::nullopt,                                                                 //
       le ? std::optional{distribution_fund_key{account, *le, ~uint8_t(0)}}               //
          : std::optional{distribution_fund_key{account, eosio::block_timestamp::max(),   //
                                                ~uint8_t(0)}},                            //
       first, last, before, after,                                                        //
       db.distribution_funds.get<by_pk>(),                                                //
       [](auto& obj) { return obj.by_pk(); },                                             //
       [&](auto& obj) { return DistributionFund{&obj}; },
       [](auto& distribution_funds, auto key) { return distribution_funds.lower_bound(key); },
       [](auto& distribution_funds, auto key) { return distribution_funds.upper_bound(key); });
}

void add_genesis_member(const status& status, eosio::name member)
{
   db.inductions.emplace([&](auto& obj) {
      obj.induction.id = available_pk(db.inductions, 1);
      obj.induction.inviter = eden_account;
      obj.induction.invitee = member;
      for (auto witness : status.initialMembers)
         if (witness != member)
            obj.induction.witnesses.push_back(witness);
   });
}

struct Nft {
   const nft_object* obj;

   auto member() const { return get_member(obj->member); }
   auto owner() const { return get_member(obj->owner); }
   auto templateId() const { return obj->templateId; }
   auto assetId() const { return obj->assetId; }
   auto templateMint() const { return obj->templateMint; }
   auto createdAt() const { return obj->createdAt; }
};
EOSIO_REFLECT2(Nft, 
               member, 
               owner, 
               templateId, 
               assetId, 
               templateMint, 
               createdAt)

NftConnection Member::nfts(std::optional<eosio::block_timestamp> gt,
                           std::optional<eosio::block_timestamp> ge,
                           std::optional<eosio::block_timestamp> lt,
                           std::optional<eosio::block_timestamp> le,
                           std::optional<uint32_t> first,
                           std::optional<uint32_t> last,
                           std::optional<std::string> before,
                           std::optional<std::string> after) const
{
   return clchain::make_connection<NftConnection, nft_account_key>(
       gt ? std::optional{nft_account_key{account, *gt, ~uint64_t(0)}}              //
          : std::nullopt,                                                           //
       ge ? std::optional{nft_account_key{account, *ge, 0}}                         //
          : std::optional{nft_account_key{account, eosio::block_timestamp{0}, 0}},  //
       lt ? std::optional{nft_account_key{account, *lt, 0}}                         //
          : std::nullopt,                                                           //
       le ? std::optional{nft_account_key{account, *le, ~uint64_t(0)}}              //
          : std::optional{nft_account_key{account, eosio::block_timestamp::max(),   //
                                                ~uint64_t(0)}},                     //
       first, last, before, after,                                                  //
       db.nfts.get<by_member>(),                                                    //
       [](auto& obj) { return obj.by_member(); },                                   //
       [&](auto& obj) { return Nft{&obj}; },
       [](auto& nfts, auto key) { return nfts.lower_bound(key); },
       [](auto& nfts, auto key) { return nfts.upper_bound(key); });
}

NftConnection Member::collectedNfts(std::optional<eosio::block_timestamp> gt,
                                    std::optional<eosio::block_timestamp> ge,
                                    std::optional<eosio::block_timestamp> lt,
                                    std::optional<eosio::block_timestamp> le,
                                    std::optional<uint32_t> first,
                                    std::optional<uint32_t> last,
                                    std::optional<std::string> before,
                                    std::optional<std::string> after) const
{
   return clchain::make_connection<NftConnection, nft_account_key>(
       gt ? std::optional{nft_account_key{account, *gt, ~uint64_t(0)}}              //
          : std::nullopt,                                                           //
       ge ? std::optional{nft_account_key{account, *ge, 0}}                         //
          : std::optional{nft_account_key{account, eosio::block_timestamp{0}, 0}},  //
       lt ? std::optional{nft_account_key{account, *lt, 0}}                         //
          : std::nullopt,                                                           //
       le ? std::optional{nft_account_key{account, *le, ~uint64_t(0)}}              //
          : std::optional{nft_account_key{account, eosio::block_timestamp::max(),   //
                                                ~uint64_t(0)}},                     //
       first, last, before, after,                                                  //
       db.nfts.get<by_owner>(),                                                    //
       [](auto& obj) { return obj.by_owner(); },                                    //
       [&](auto& obj) { return Nft{&obj}; },
       [](auto& nfts, auto key) { return nfts.lower_bound(key); },
       [](auto& nfts, auto key) { return nfts.upper_bound(key); });
}

struct block_state
{
   bool in_withdraw = false;
   bool in_manual_transfer = false;
};

struct action_context
{
   const subchain::eosio_block& block;
   block_state& block_state;
   const subchain::transaction& transaction;
   const subchain::action& action;
};

void clear_table(auto& table)
{
   for (auto it = table.begin(); it != table.end();)
   {
      auto next = it;
      ++next;
      table.remove(*it);
      it = next;
   }
}

void clearall()
{
   clear_table(db.status);
   clear_table(db.balances);
   clear_table(db.balance_history);
   clear_table(db.inductions);
   clear_table(db.members);
   clear_table(db.elections);
   clear_table(db.election_rounds);
   clear_table(db.election_groups);
   clear_table(db.votes);
   clear_table(db.distributions);
   clear_table(db.distribution_funds);
   clear_table(db.nfts);
}

eosio::asset add_balance(eosio::name account, const eosio::asset& delta)
{
   eosio::asset result;
   add_or_modify<by_pk>(db.balances, account, [&](bool is_new, auto& a) {
      if (is_new)
      {
         a.account = account;
         a.amount = delta;
      }
      else
         a.amount += delta;
      result = a.amount;
   });
   return result;
}

void transfer_funds(eosio::block_timestamp time,
                    eosio::name from,
                    eosio::name to,
                    eosio::asset amount,
                    history_desc description)
{
   auto new_from = add_balance(from, -amount);
   auto new_to = add_balance(to, amount);
   db.balance_history.emplace([&](auto& h) {
      h.time = time;
      h.account = from;
      h.delta = -amount;
      h.new_amount = new_from;
      h.other_account = to;
      h.description = description;
   });
   db.balance_history.emplace([&](auto& h) {
      h.time = time;
      h.account = to;
      h.delta = amount;
      h.new_amount = new_to;
      h.other_account = from;
      h.description = description;
   });
}

void notify_transfer(const action_context& context,
                     eosio::name from,
                     eosio::name to,
                     const eosio::asset& quantity,
                     std::string memo)
{
   // eosio::print("transfer ", from, " ", to, " ", quantity, " ", memo, "\n");
   if (to == eden_account)
   {
      transfer_funds(context.block.timestamp, token_account, from, quantity, history_desc::deposit);
      if (!eden::is_possible_deposit_account(from, atomic_account, atomicmarket_account))
         transfer_funds(context.block.timestamp, from, master_pool, quantity, history_desc::fund);
   }
   else if (context.block_state.in_withdraw)
   {
      transfer_funds(context.block.timestamp, to, token_account, quantity, history_desc::withdraw);
      context.block_state.in_withdraw = false;
   }
   else
   {
      transfer_funds(context.block.timestamp, master_pool, to, quantity,
                     context.block_state.in_manual_transfer ? history_desc::manual_transfer
                                                            : history_desc::external_spend);
      transfer_funds(context.block.timestamp, to, token_account, quantity, history_desc::withdraw);
      context.block_state.in_manual_transfer = false;
   }
}

void check_transfer_order(const action_context& context)
{
   eosio::check(!context.block_state.in_withdraw && !context.block_state.in_manual_transfer,
                "transfer notifications have incorrect order");
}

void withdraw(const action_context& context, eosio::name owner, const eosio::asset& quantity)
{
   check_transfer_order(context);
   context.block_state.in_withdraw = true;
   // notify_transfer records the withdraw
}

void donate(const action_context& context, eosio::name payer, const eosio::asset& quantity)
{
   transfer_funds(context.block.timestamp, payer, master_pool, quantity, history_desc::donate);
}

void transfer(const action_context& context,
              eosio::name to,
              const eosio::asset& quantity,
              const std::string& memo)
{
   check_transfer_order(context);
   context.block_state.in_manual_transfer = true;
   // notify_transfer records the transfer
}

void fundtransfer(const action_context& context,
                  eosio::name from,
                  eosio::block_timestamp distribution_time,
                  uint8_t rank,
                  eosio::name to,
                  eosio::asset amount,
                  const std::string& memo)
{
   transfer_funds(context.block.timestamp, distribution_fund, to, amount,
                  history_desc::fund_transfer);
   modify<by_pk>(db.distribution_funds, distribution_fund_key{from, distribution_time, rank},
                 [&](auto& fund) { fund.current_balance -= amount; });
}

void usertransfer(const action_context& context,
                  eosio::name from,
                  eosio::name to,
                  eosio::asset amount,
                  const std::string& memo)
{
   transfer_funds(context.block.timestamp, from, to, amount, history_desc::user_transfer);
}

void genesis(std::string community,
             eosio::symbol community_symbol,
             eosio::asset minimum_donation,
             std::vector<eosio::name> initial_members,
             std::string genesis_video,
             eden::atomicassets::attribute_map collection_attributes,
             eosio::asset auction_starting_bid,
             uint32_t auction_duration,
             std::string memo)
{
   auto& idx = db.status.get<by_id>();
   eosio::check(idx.empty(), "duplicate genesis action");
   db.status.emplace([&](auto& obj) {
      obj.status.community = std::move(community);
      obj.status.communitySymbol = std::move(community_symbol);
      obj.status.minimumDonation = std::move(minimum_donation);
      obj.status.initialMembers = std::move(initial_members);
      obj.status.genesisVideo = std::move(genesis_video);
      obj.status.collectionAttributes = std::move(collection_attributes);
      obj.status.auctionStartingBid = std::move(auction_starting_bid);
      obj.status.auctionDuration = std::move(auction_duration);
      obj.status.memo = std::move(memo);
      for (auto& member : obj.status.initialMembers)
         add_genesis_member(obj.status, member);
   });
}

void addtogenesis(eosio::name new_genesis_member)
{
   auto& status = get_status();
   db.status.modify(get_status(),
                    [&](auto& obj) { obj.status.initialMembers.push_back(new_genesis_member); });
   for (auto& obj : db.inductions)
      db.inductions.modify(
          obj, [&](auto& obj) { obj.induction.witnesses.push_back(new_genesis_member); });
   add_genesis_member(status.status, new_genesis_member);
}

void inductinit(uint64_t id,
                eosio::name inviter,
                eosio::name invitee,
                std::vector<eosio::name> witnesses)
{
   // TODO: expire records

   // contract doesn't allow inductinit() until it transitioned to active
   const auto& status = get_status();
   if (!status.status.active)
      db.status.modify(status, [&](auto& obj) { obj.status.active = true; });

   add_or_replace<by_pk>(db.inductions, id, [&](auto& obj) {
      obj.induction.id = id;
      obj.induction.inviter = inviter;
      obj.induction.invitee = invitee;
      obj.induction.witnesses = witnesses;
   });
}

void inductprofil(uint64_t id, eden::new_member_profile profile)
{
   modify<by_pk>(db.inductions, id, [&](auto& obj) { obj.induction.profile = profile; });
}

void inductvideo(eosio::name account, uint64_t id, std::string video)
{
   modify<by_pk>(db.inductions, id, [&](auto& obj) { obj.induction.video = video; });
}

void inductcancel(eosio::name account, uint64_t id)
{
   remove_if_exists<by_pk>(db.inductions, id);
}

void inductdonate(const action_context& context,
                  eosio::name payer,
                  uint64_t id,
                  eosio::asset quantity)
{
   auto& induction = get<by_pk>(db.inductions, id);
   auto& member = db.members.emplace([&](auto& obj) {
      obj.member.account = induction.induction.invitee;
      obj.member.inviter = induction.induction.inviter;
      obj.member.inductionWitnesses = induction.induction.witnesses;
      obj.member.profile = induction.induction.profile;
      obj.member.inductionVideo = induction.induction.video;
      obj.member.createdAt = eosio::block_timestamp(context.block.timestamp);
      if (obj.member.inductionVideo.empty())
         obj.member.inductionVideo = get_status().status.genesisVideo;
   });
   transfer_funds(context.block.timestamp, payer, master_pool, quantity,
                  history_desc::inductdonate);

   auto& index = db.inductions.get<by_invitee>();
   for (auto it = index.lower_bound(std::pair<eosio::name, uint64_t>{member.member.account, 0});
        it != index.end() && it->induction.invitee == member.member.account;)
   {
      auto next = it;
      ++next;
      db.inductions.remove(*it);
      it = next;
   }
}

void resign(eosio::name account)
{
   remove_if_exists<by_pk>(db.members, account);
}

void clear_participating()
{
   auto& idx = db.members.template get<by_pk>();
   for (auto it = idx.begin(); it != idx.end(); ++it)
      if (it->member.participating)
         db.members.modify(*it, [](auto& obj) { obj.member.participating = false; });
   db.status.modify(get_status(), [&](auto& status) { status.status.numElectionParticipants = 0; });
}

void electopt(eosio::name voter, bool participating)
{
   modify<by_pk>(db.members, voter, [&](auto& obj) { obj.member.participating = participating; });
   db.status.modify(get_status(), [&](auto& status) {
      status.status.numElectionParticipants += participating ? 1 : -1;
   });
}

void electvote(uint8_t round, eosio::name voter, eosio::name candidate)
{
   auto& election_idx = db.elections.get<by_pk>();
   eosio::check(!election_idx.empty(), "electvote without any elections");
   auto& election = *--election_idx.end();
   auto& vote = get<by_pk>(db.votes, std::tuple{voter, election.time, round});
   db.votes.modify(vote, [&](auto& vote) { vote.candidate = candidate; });
}

void electvideo(uint8_t round, eosio::name voter, const std::string& video)
{
   auto& election_idx = db.elections.get<by_pk>();
   if (election_idx.empty())
      return;
   auto& election = *--election_idx.end();
   auto* vote = get_ptr<by_pk>(db.votes, std::tuple{voter, election.time, round});
   if (vote)
      db.votes.modify(*vote, [&](auto& vote) { vote.video = video; });
}

void logmint(const action_context& context,
             uint64_t asset_id,
             eosio::name authorized_minter,
             eosio::name collection_name,
             eosio::name schema_name,
             int32_t template_id,
             eosio::name new_asset_owner,
             eden::atomicassets::attribute_map immutable_data,
             eden::atomicassets::attribute_map mutable_data,
             std::vector<eosio::asset> backed_tokens,
             eden::atomicassets::attribute_map immutable_template_data) 
{
   if (authorized_minter != eden_account || collection_name != eden_account
      || schema_name != eden::schema_name)
      return;
   
   auto account_pos = std::find_if(immutable_template_data.begin(), immutable_data.end(),
                                   [](const auto& attr) { return attr.key == "account"; });
   if (account_pos == immutable_template_data.end())
      return; // this nft has no eden member account value

   eosio::name member_account(std::get<std::string>(account_pos->value));

   uint64_t template_mint = 0;
   auto& index = db.nfts.get<by_member>();
   for (auto it = index.lower_bound(nft_account_key{member_account, eosio::block_timestamp(0), 0});
        it != index.end() && it->member == member_account; it++)
   {
      template_mint++;
   }

   db.nfts.emplace([&](auto& nft) {
      nft.member = member_account;
      nft.owner = new_asset_owner;
      nft.templateId = template_id;
      nft.assetId = asset_id;
      nft.templateMint = template_mint;
      nft.createdAt = eosio::block_timestamp(context.block.timestamp);
   });
}

void logtransfer(const action_context& context,
                 eosio::name collection_name,
                 eosio::name from,
                 eosio::name to,
                 std::vector<uint64_t> asset_ids,
                 std::string memo)
{
   if (collection_name != eden_account)
      return;

   auto& index = db.nfts.get<by_pk>();

   for (const auto& asset_id : asset_ids) {
      auto it = index.find(asset_id);
      if (it == index.end()) {
         continue;
      }
      
      db.nfts.modify(*it, [&](auto& nft) {
         nft.owner = to;
      });
   }
}

void handle_event(const eden::election_event_schedule& event)
{
   db.status.modify(get_status(), [&](auto& status) {
      status.status.nextElection = event.election_time;
      status.status.electionThreshold = event.election_threshold;
   });
}

void handle_event(const eden::election_event_begin& event)
{
   db.elections.emplace([&](auto& election) { election.time = event.election_time; });
}

void handle_event(const eden::election_event_seeding& event)
{
   modify<by_pk>(db.elections, event.election_time, [&](auto& election) {
      election.seeding = true;
      election.seeding_start_time = event.start_time;
      election.seeding_end_time = event.end_time;
      election.seed = event.seed;
   });
}

void handle_event(const eden::election_event_end_seeding& event)
{
   modify<by_pk>(db.elections, event.election_time, [&](auto& election) {
      election.seeding = false;
      election.seeding_start_time = std::nullopt;
      election.seeding_end_time = std::nullopt;
   });
}

void handle_event(const eden::election_event_config_summary& event)
{
   modify<by_pk>(db.elections, event.election_time, [&](auto& election) {
      election.num_rounds = event.num_rounds;
      election.num_participants = event.num_participants;
   });
}

void handle_event(const eden::election_event_create_round& event)
{
   db.election_rounds.emplace([&](auto& round) {
      round.election_time = event.election_time;
      round.round = event.round;
      round.num_participants = event.num_participants;
      round.num_groups = event.num_groups;
      round.requires_voting = event.requires_voting;
   });
}

void handle_event(const eden::election_event_create_group& event)
{
   eosio::check(!event.voters.empty(), "group has no voters");
   auto& group = db.election_groups.emplace([&](auto& group) {
      group.election_time = event.election_time;
      group.round = event.round;
      group.first_member = *std::min_element(event.voters.begin(), event.voters.end());
   });
   for (auto voter : event.voters)
   {
      db.votes.emplace([&](auto& vote) {
         vote.election_time = group.election_time;
         vote.round = event.round;
         vote.group_id = group.id._id;
         vote.voter = voter;
      });
   }
}

void handle_event(const eden::election_event_begin_round_voting& event)
{
   modify<by_round>(db.election_rounds, ElectionRoundKey{event.election_time, event.round},
                    [&](auto& round) {
                       round.groups_available = true;
                       round.voting_started = true;
                       round.voting_begin = event.voting_begin;
                       round.voting_end = event.voting_end;
                    });
}

void handle_event(const eden::election_event_end_round_voting& event)
{
   modify<by_round>(db.election_rounds, ElectionRoundKey{event.election_time, event.round},
                    [&](auto& round) { round.voting_finished = true; });
}

void handle_event(const eden::election_event_report_group& event)
{
   eosio::check(!event.votes.empty(), "group has no votes");
   auto first_member =
       std::min_element(event.votes.begin(), event.votes.end(), [](auto& a, auto& b) {
          return a.voter < b.voter;
       })->voter;
   auto& group = get<by_pk>(db.election_groups,
                            ElectionGroupKey{event.election_time, event.round, first_member});
   db.election_groups.modify(group, [&](auto& group) { group.winner = event.winner; });
   for (auto& v : event.votes)
   {
      auto& vote = get<by_pk>(db.votes, std::tuple{v.voter, event.election_time, event.round});
      db.votes.modify(vote, [&](auto& vote) { vote.candidate = v.candidate; });
   }
}

void handle_event(const eden::election_event_end_round& event)
{
   modify<by_round>(db.election_rounds, ElectionRoundKey{event.election_time, event.round},
                    [&](auto& round) { round.results_available = true; });
}

void handle_event(const eden::election_event_end& event)
{
   modify<by_pk>(db.elections, event.election_time, [&](auto& election) {
      election.results_available = true;
      if (!election.num_rounds)
         return;
      auto& idx = db.election_groups.get<by_pk>();
      auto it =
          idx.lower_bound(ElectionGroupKey{event.election_time, *election.num_rounds - 1, ""_n});
      if (it != idx.end() && it->election_time == event.election_time &&
          it->round == *election.num_rounds - 1)
         election.final_group_id = it->id._id;
   });
   clear_participating();
}

void handle_event(const eden::distribution_event_schedule& event)
{
   db.distributions.emplace([&](auto& dist) { dist.time = event.distribution_time; });
}

void handle_event(const action_context& context, const eden::distribution_event_reserve& event)
{
   modify<by_pk>(db.distributions, event.distribution_time, [&](auto& dist) {
      transfer_funds(context.block.timestamp, pool_account(event.pool), distribution_fund,
                     event.target_amount, history_desc::reserve_distribution);
      dist.target_amount = event.target_amount;
   });
}

void handle_event(const eden::distribution_event_begin& event)
{
   modify<by_pk>(db.distributions, event.distribution_time, [&](auto& dist) {
      dist.started = true;
      dist.target_rank_distribution = event.rank_distribution;
   });
}

void handle_event(const action_context& context,
                  const eden::distribution_event_return_excess& event)
{
   transfer_funds(context.block.timestamp, distribution_fund, pool_account(event.pool),
                  event.amount, history_desc::return_excess_distribution);
}

void handle_event(const action_context& context, const eden::distribution_event_return& event)
{
   transfer_funds(context.block.timestamp, distribution_fund, pool_account(event.pool),
                  event.amount, history_desc::return_distribution);
   modify<by_pk>(db.distribution_funds,
                 distribution_fund_key{event.owner, event.distribution_time, event.rank},
                 [&](auto& fund) { fund.current_balance -= event.amount; });
}

void handle_event(const eden::distribution_event_fund& event)
{
   db.distribution_funds.emplace([&](auto& fund) {
      fund.owner = event.owner;
      fund.distribution_time = event.distribution_time;
      fund.rank = event.rank;
      fund.initial_balance = event.balance;
      fund.current_balance = event.balance;
   });
}

void handle_event(const auto& event) {}

void handle_event(const action_context& context, const auto& event)
{
   handle_event(event);
}

void handle_event(const action_context& context, const eden::event& event)
{
   std::visit([&](const auto& event) { handle_event(context, event); }, event);
}

template <typename... Args>
void call(void (*f)(Args...), const action_context& context, const std::vector<char>& data)
{
   std::tuple<eosio::remove_cvref_t<Args>...> t;
   eosio::input_stream s(data);
   // TODO: prevent abort, indicate what failed
   eosio::from_bin(t, s);
   std::apply([f](auto&&... args) { f(std::move(args)...); }, t);
}

template <typename... Args>
void call(void (*f)(const action_context&, Args...),
          const action_context& context,
          const std::vector<char>& data)
{
   std::tuple<eosio::remove_cvref_t<Args>...> t;
   eosio::input_stream s(data);
   // TODO: prevent abort, indicate what failed
   eosio::from_bin(t, s);
   std::apply([&](auto&&... args) { f(context, std::move(args)...); }, t);
}

void filter_block(const subchain::eosio_block& block)
{
   block_state block_state{};
   for (auto& trx : block.transactions)
   {
      for (auto& action : trx.actions)
      {
         action_context context{block, block_state, trx, action};
         if (action.firstReceiver == eden_account)
         {
            if (action.name == "clearall"_n)
               call(clearall, context, action.hexData.data);
            else if (action.name == "withdraw"_n)
               call(withdraw, context, action.hexData.data);
            else if (action.name == "donate"_n)
               call(donate, context, action.hexData.data);
            else if (action.name == "transfer"_n)
               call(transfer, context, action.hexData.data);
            else if (action.name == "fundtransfer"_n)
               call(fundtransfer, context, action.hexData.data);
            else if (action.name == "usertransfer"_n)
               call(usertransfer, context, action.hexData.data);
            else if (action.name == "genesis"_n)
               call(genesis, context, action.hexData.data);
            else if (action.name == "addtogenesis"_n)
               call(addtogenesis, context, action.hexData.data);
            else if (action.name == "inductinit"_n)
               call(inductinit, context, action.hexData.data);
            else if (action.name == "inductprofil"_n)
               call(inductprofil, context, action.hexData.data);
            else if (action.name == "inductvideo"_n)
               call(inductvideo, context, action.hexData.data);
            else if (action.name == "inductcancel"_n)
               call(inductcancel, context, action.hexData.data);
            else if (action.name == "inductdonate"_n)
               call(inductdonate, context, action.hexData.data);
            else if (action.name == "resign"_n)
               call(resign, context, action.hexData.data);
            else if (action.name == "electopt"_n)
               call(electopt, context, action.hexData.data);
            else if (action.name == "electvote"_n)
               call(electvote, context, action.hexData.data);
            else if (action.name == "electvideo"_n)
               call(electvideo, context, action.hexData.data);
         }
         else if (action.firstReceiver == token_account && action.receiver == eden_account &&
                  action.name == "transfer"_n)
            call(notify_transfer, context, action.hexData.data);
         else if (action.firstReceiver == "eosio.null"_n && action.name == "eden.events"_n &&
                  action.creatorAction && action.creatorAction->receiver == eden_account)
         {
            // TODO: prevent abort, indicate what failed
            auto events = eosio::convert_from_bin<std::vector<eden::event>>(action.hexData.data);
            for (auto& event : events)
               handle_event(context, event);
         }
         else if (action.firstReceiver == atomic_account && action.receiver == eden_account)
         {
            if (action.name == "logmint"_n)
               call(logmint, context, action.hexData.data);
            else if (action.name == "logtransfer"_n)
               call(logtransfer, context, action.hexData.data);
         }
      }  // for(action)
      eosio::check(!block_state.in_withdraw && !block_state.in_manual_transfer,
                   "missing transfer notification");
   }  // for(trx)
}  // filter_block

std::vector<subchain::transaction> ship_to_eden_transactions(
    std::vector<eosio::ship_protocol::transaction_trace>& traces)
{
   std::vector<subchain::transaction> transactions;

   for (const auto& transaction_trace : traces)
   {
      if (auto* trx_trace =
              std::get_if<eosio::ship_protocol::transaction_trace_v0>(&transaction_trace))
      {
         subchain::transaction transaction{
             .id = trx_trace->id,
         };

         for (const auto& action_trace : trx_trace->action_traces)
         {
            if (auto* act_trace = std::get_if<eosio::ship_protocol::action_trace_v0>(&action_trace))
            {
               std::optional<subchain::creator_action> creatorAction;
               if (act_trace->creator_action_ordinal.value > 0)
               {
                  const auto& creator_action_trace =
                      std::get<eosio::ship_protocol::action_trace_v0>(
                          trx_trace->action_traces[act_trace->creator_action_ordinal.value - 1]);
                  const auto& receipt = std::get<eosio::ship_protocol::action_receipt_v0>(
                      *creator_action_trace.receipt);
                  creatorAction = subchain::creator_action{
                      .seq = receipt.global_sequence,
                      .receiver = creator_action_trace.receiver,
                  };
               }

               std::vector<char> data(act_trace->act.data.pos, act_trace->act.data.end);
               eosio::bytes hexData{data};

               const auto& receipt =
                   std::get<eosio::ship_protocol::action_receipt_v0>(*act_trace->receipt);

               subchain::action action{
                   .seq = receipt.global_sequence,
                   .firstReceiver = act_trace->act.account,
                   .receiver = act_trace->receiver,
                   .name = act_trace->act.name,
                   .creatorAction = creatorAction,
                   .hexData = std::move(hexData),
               };

               transaction.actions.push_back(std::move(action));
            }
         }

         transactions.push_back(std::move(transaction));
      }
   }

   return transactions;
}

subchain::block_log block_log;

void forked_n_blocks(size_t n)
{
   if (n)
      printf("forked %d blocks, %d now in log\n", (int)n, (int)block_log.blocks.size());
   while (n--)
      db.db.undo();
}

bool add_block(subchain::block_with_id&& bi, uint32_t eosio_irreversible)
{
   auto [status, num_forked] = block_log.add_block(bi);
   if (status)
      return false;
   forked_n_blocks(num_forked);
   if (auto* b = block_log.block_before_eosio_num(eosio_irreversible + 1))
      block_log.irreversible = std::max(block_log.irreversible, b->num);
   db.db.commit(block_log.irreversible);
   bool need_undo = bi.num > block_log.irreversible;
   auto session = db.db.start_undo_session(bi.num > block_log.irreversible);
   filter_block(bi.eosioBlock);
   session.push();
   if (!need_undo)
      db.db.set_revision(bi.num);
   // printf("%s block: %d %d log: %d irreversible: %d db: %d-%d %s\n", block_log.status_str[status],
   //        (int)bi.eosioBlock.num, (int)bi.num, (int)block_log.blocks.size(),
   //        block_log.irreversible,  //
   //        (int)db.db.undo_stack_revision_range().first,
   //        (int)db.db.undo_stack_revision_range().second,  //
   //        to_string(bi.eosioBlock.id).c_str());
   return true;
}

bool add_block(subchain::block&& eden_block, uint32_t eosio_irreversible)
{
   auto bin = eosio::convert_to_bin(eden_block);
   subchain::block_with_id bi;
   static_cast<subchain::block&>(bi) = std::move(eden_block);
   bi.id = clchain::sha256(bin.data(), bin.size());
   auto bin_with_id = eosio::convert_to_bin(bi.id);
   bin_with_id.insert(bin_with_id.end(), bin.begin(), bin.end());
   result = std::move(bin_with_id);
   return add_block(std::move(bi), eosio_irreversible);
}

bool add_block(subchain::eosio_block&& eosioBlock, uint32_t eosio_irreversible) {
   subchain::block eden_block;
   eden_block.eosioBlock = std::move(eosioBlock); 

   auto* eden_prev = block_log.block_before_eosio_num(eden_block.eosioBlock.num);
   if (eden_prev)
   {
      eden_block.num = eden_prev->num + 1;
      eden_block.previous = eden_prev->id;
   }
   else
      eden_block.num = 1;

   return add_block(std::move(eden_block), eosio_irreversible);
}

bool add_block(eosio::ship_protocol::block_position block,
               eosio::ship_protocol::block_position prev,
               uint32_t eosio_irreversible,
               eosio::block_timestamp timestamp,
               std::vector<eosio::ship_protocol::transaction_trace> traces)
{
   subchain::eosio_block eosio_block;
   eosio_block.num = block.block_num;
   eosio_block.id = block.block_id;
   eosio_block.previous = prev.block_id;
   eosio_block.timestamp = timestamp.to_time_point();
   eosio_block.transactions = ship_to_eden_transactions(traces);
   return add_block(std::move(eosio_block), eosio_irreversible);
}

// TODO: prevent from_json from aborting
[[clang::export_name("addEosioBlockJson")]] bool addEosioBlockJson(const char* json,
                                                                   uint32_t size,
                                                                   uint32_t eosio_irreversible)
{
   std::string str(json, size);
   eosio::json_token_stream s(str.data());
   subchain::eosio_block eosio_block;
   eosio::from_json(eosio_block, s);
   return add_block(std::move(eosio_block), eosio_irreversible);
   // printf("%d blocks processed, %d blocks now in log\n", (int)eosio_blocks.size(),
   //        (int)block_log.blocks.size());
   // for (auto& b : block_log.blocks)
   //    printf("%d\n", (int)b->num);
}

// TODO: prevent from_bin from aborting
[[clang::export_name("addBlock")]] bool addBlock(const char* data,
                                                 uint32_t size,
                                                 uint32_t eosio_irreversible)
{
   // TODO: verify id integrity
   eosio::input_stream bin{data, size};
   subchain::block_with_id block;
   eosio::from_bin(block, bin);
   return add_block(std::move(block), eosio_irreversible);
}

[[clang::export_name("getShipBlocksRequest")]] bool getShipBlocksRequest(uint32_t block_num)
{
   eosio::ship_protocol::request request = eosio::ship_protocol::get_blocks_request_v0{
       .start_block_num = block_num,
       .end_block_num = 0xffff'ffff,
       .max_messages_in_flight = 0xffff'ffff,
       .fetch_block = true,
       .fetch_traces = true,
   };
   result = eosio::convert_to_bin(request);

   return true;
}

[[clang::export_name("pushShipMessage")]] bool pushShipMessage(const char* data,
                                                               uint32_t size)
{
   eosio::input_stream bin{data, size};
   eosio::ship_protocol::result result;
   eosio::from_bin(result, bin);

   if (auto* blocks_result = std::get_if<eosio::ship_protocol::get_blocks_result_v0>(&result))
   {
      eosio::ship_protocol::signed_block signed_block;
      if (blocks_result->block)
      {
         eosio::from_bin(signed_block, blocks_result->block.value());
      }

      std::vector<eosio::ship_protocol::transaction_trace> traces;
      if (blocks_result->traces)
      {
         eosio::from_bin(traces, blocks_result->traces.value());
      }

      auto prev_block = blocks_result->prev_block ? blocks_result->prev_block.value()
                                                  : eosio::ship_protocol::block_position{};

      return add_block(blocks_result->this_block.value(), prev_block,
                       blocks_result->last_irreversible.block_num, signed_block.timestamp, traces);
   }
   return false;
}

[[clang::export_name("setIrreversible")]] uint32_t setIrreversible(uint32_t irreversible)
{
   if (auto* b = block_log.block_before_num(irreversible + 1))
      block_log.irreversible = std::max(block_log.irreversible, b->num);
   db.db.commit(block_log.irreversible);
   return block_log.irreversible;
}

[[clang::export_name("trimBlocks")]] void trimBlocks()
{
   block_log.trim();
}

[[clang::export_name("undoBlockNum")]] void undoBlockNum(uint32_t blockNum)
{
   forked_n_blocks(block_log.undo(blockNum));
}

[[clang::export_name("undoEosioNum")]] void undoEosioNum(uint32_t eosioNum)
{
   if (auto* b = block_log.block_by_eosio_num(eosioNum))
      forked_n_blocks(block_log.undo(b->num));
}

[[clang::export_name("getBlock")]] bool getBlock(uint32_t num)
{
   auto block = block_log.block_by_num(num);
   if (!block)
      return false;
   result = eosio::convert_to_bin(*block);
   return true;
}

constexpr const char MemberConnection_name[] = "MemberConnection";
constexpr const char MemberEdge_name[] = "MemberEdge";
using MemberConnection =
    clchain::Connection<clchain::ConnectionConfig<Member, MemberConnection_name, MemberEdge_name>>;

constexpr const char ElectionConnection_name[] = "ElectionConnection";
constexpr const char ElectionEdge_name[] = "ElectionEdge";
using ElectionConnection = clchain::Connection<
    clchain::ConnectionConfig<Election, ElectionConnection_name, ElectionEdge_name>>;

constexpr const char DistributionConnection_name[] = "DistributionConnection";
constexpr const char DistributionEdge_name[] = "DistributionEdge";
using DistributionConnection = clchain::Connection<
    clchain::ConnectionConfig<Distribution, DistributionConnection_name, DistributionEdge_name>>;

struct Query
{
   subchain::BlockLog blockLog;

   std::optional<Status> status() const
   {
      auto& idx = db.status.get<by_id>();
      if (idx.size() != 1)
         return std::nullopt;
      return Status{&idx.begin()->status};
   }

   BalanceConnection balances(std::optional<eosio::name> gt,
                              std::optional<eosio::name> ge,
                              std::optional<eosio::name> lt,
                              std::optional<eosio::name> le,
                              std::optional<uint32_t> first,
                              std::optional<uint32_t> last,
                              std::optional<std::string> before,
                              std::optional<std::string> after) const
   {
      return clchain::make_connection<BalanceConnection, eosio::name>(
          gt, ge, lt, le, first, last, before, after,  //
          db.balances.get<by_pk>(),                    //
          [](auto& obj) { return obj.account; },       //
          [](auto& obj) {
             return Balance{obj.account, &obj};
          },
          [](auto& balances, auto key) { return balances.lower_bound(key); },
          [](auto& balances, auto key) { return balances.upper_bound(key); });
   }

   Balance masterPool() const { return get_balance(master_pool); }
   Balance distributionFund() const { return get_balance(distribution_fund); }

   MemberConnection members(std::optional<eosio::name> gt,
                            std::optional<eosio::name> ge,
                            std::optional<eosio::name> lt,
                            std::optional<eosio::name> le,
                            std::optional<uint32_t> first,
                            std::optional<uint32_t> last,
                            std::optional<std::string> before,
                            std::optional<std::string> after) const
   {
      return clchain::make_connection<MemberConnection, eosio::name>(
          gt, ge, lt, le, first, last, before, after,    //
          db.members.get<by_pk>(),                       //
          [](auto& obj) { return obj.member.account; },  //
          [](auto& obj) {
             return Member{obj.member.account, &obj.member};
          },
          [](auto& members, auto key) { return members.lower_bound(key); },
          [](auto& members, auto key) { return members.upper_bound(key); });
   }

   MemberConnection membersByCreatedAt(std::optional<eosio::block_timestamp> gt,
                                       std::optional<eosio::block_timestamp> ge,
                                       std::optional<eosio::block_timestamp> lt,
                                       std::optional<eosio::block_timestamp> le,
                                       std::optional<uint32_t> first,
                                       std::optional<uint32_t> last,
                                       std::optional<std::string> before,
                                       std::optional<std::string> after) const
   {
      return clchain::make_connection<MemberConnection, MemberCreatedAtKey>(
          gt ? std::optional{MemberCreatedAtKey{*gt, account_max}}                  //
             : std::nullopt,                                                        //
          ge ? std::optional{MemberCreatedAtKey{*ge, account_min}}                  //
             : std::nullopt,                                                        //
          lt ? std::optional{MemberCreatedAtKey{*lt, account_min}}                  //
             : std::nullopt,                                                        //
          le ? std::optional{MemberCreatedAtKey{*le, account_max}}                  //
             : std::nullopt,                                                        //
          first, last, before, after,                                               //
          db.members.get<by_createdAt>(),                                           //
          [](auto& obj) { return obj.by_createdAt(); },                             //
          [](auto& obj) {
             return Member{obj.member.account, &obj.member};
          },
          [](auto& members, auto key) { return members.lower_bound(key); },
          [](auto& members, auto key) { return members.upper_bound(key); });
   }

   ElectionConnection elections(std::optional<eosio::block_timestamp> gt,
                                std::optional<eosio::block_timestamp> ge,
                                std::optional<eosio::block_timestamp> lt,
                                std::optional<eosio::block_timestamp> le,
                                std::optional<uint32_t> first,
                                std::optional<uint32_t> last,
                                std::optional<std::string> before,
                                std::optional<std::string> after) const
   {
      return clchain::make_connection<ElectionConnection, eosio::block_timestamp>(
          gt, ge, lt, le, first, last, before, after,  //
          db.elections.get<by_pk>(),                   //
          [](auto& obj) { return obj.time; },          //
          [](auto& obj) { return Election{&obj}; },
          [](auto& elections, auto key) { return elections.lower_bound(key); },
          [](auto& elections, auto key) { return elections.upper_bound(key); });
   }

   DistributionConnection distributions(std::optional<eosio::block_timestamp> gt,
                                        std::optional<eosio::block_timestamp> ge,
                                        std::optional<eosio::block_timestamp> lt,
                                        std::optional<eosio::block_timestamp> le,
                                        std::optional<uint32_t> first,
                                        std::optional<uint32_t> last,
                                        std::optional<std::string> before,
                                        std::optional<std::string> after) const
   {
      return clchain::make_connection<DistributionConnection, eosio::block_timestamp>(
          gt, ge, lt, le, first, last, before, after,  //
          db.distributions.get<by_pk>(),               //
          [](auto& obj) { return obj.time; },          //
          [](auto& obj) { return Distribution{&obj}; },
          [](auto& distributions, auto key) { return distributions.lower_bound(key); },
          [](auto& distributions, auto key) { return distributions.upper_bound(key); });
   }
};
EOSIO_REFLECT2(Query,
               blockLog,
               status,
               masterPool,
               distributionFund,
               method(balances, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
               method(members, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
               method(membersByCreatedAt, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
               method(elections, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
               method(distributions, "gt", "ge", "lt", "le", "first", "last", "before", "after"))

auto schema = clchain::get_gql_schema<Query>();
[[clang::export_name("getSchemaSize")]] uint32_t getSchemaSize()
{
   return schema.size();
}
[[clang::export_name("getSchema")]] const char* getSchema()
{
   return schema.c_str();
}

[[clang::export_name("query")]] void query(const char* query,
                                           uint32_t size,
                                           const char* variables,
                                           uint32_t variables_size)
{
   Query root{block_log};
   result = clchain::gql_query(root, {query, size}, {variables, variables_size});
}
