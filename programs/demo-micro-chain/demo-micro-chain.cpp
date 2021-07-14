#include <boost/multi_index/mem_fun.hpp>
#include <boost/multi_index/member.hpp>
#include <boost/multi_index/ordered_index.hpp>
#include <boost/multi_index_container.hpp>
#include <chainbase/chainbase.hpp>
#include <clchain/crypto.hpp>
#include <clchain/eden_chain.hpp>
#include <clchain/graphql.hpp>
#include <eden.hpp>
#include <eosio/to_bin.hpp>

using namespace eosio::literals;

extern "C" void __wasm_call_ctors();
[[clang::export_name("initialize")]] void initialize()
{
   __wasm_call_ctors();
}

[[clang::export_name("allocate_memory")]] void* allocate_memory(uint32_t size)
{
   return malloc(size);
}

[[clang::export_name("free_memory")]] void free_memory(void* p)
{
   free(p);
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

enum tables
{
   induction_table
};

struct induction
{
   uint64_t id;
   eosio::name inviter;
   eosio::name invitee;
   std::vector<eosio::name> witnesses;
   eden::new_member_profile profile;
   std::string video;
};
EOSIO_REFLECT(induction, id, inviter, invitee, witnesses, profile, video)

void dump(const induction& ind)
{
   printf("%s\n", eosio::format_json(ind).c_str());
}

struct induction_object : public chainbase::object<induction_table, induction_object>
{
   CHAINBASE_DEFAULT_CONSTRUCTOR(induction_object)

   id_type id;
   induction induction;

   uint64_t pk() const { return induction.id; }
};

struct by_id;
struct by_pk;

typedef boost::multi_index_container<
    induction_object,
    boost::multi_index::indexed_by<
        boost::multi_index::ordered_unique<  //
            boost::multi_index::tag<by_id>,
            boost::multi_index::
                member<induction_object, induction_object::id_type, &induction_object::id>>,
        boost::multi_index::ordered_unique<  //
            boost::multi_index::tag<by_pk>,
            boost::multi_index::const_mem_fun<induction_object, uint64_t, &induction_object::pk>>>,
    chainbase::allocator<induction_object>>
    induction_index;
CHAINBASE_SET_INDEX_TYPE(induction_object, induction_index)

struct database
{
   chainbase::database db;
   chainbase::generic_index<induction_index> inductions;

   database() { db.add_index(inductions); }
};
database db;

template <typename Tag, typename Index, typename Key, typename F>
void add_or_modify(Index& index, const Key& key, F&& f)
{
   auto& idx = index.template get<Tag>();
   auto it = idx.find(key);
   if (it != idx.end())
      index.modify(*it, f);
   else
      index.emplace(f);
}

template <typename Tag, typename Index, typename Key, typename F>
void add_or_replace(Index& index, const Key& key, F&& f)
{
   auto& idx = index.template get<Tag>();
   auto it = idx.find(key);
   if (it != idx.end())
      index.remove(*it);
   index.emplace(f);
}

template <typename Tag, typename Index, typename Key>
void remove_if_exists(Index& index, const Key& key)
{
   auto& idx = index.template get<Tag>();
   auto it = idx.find(key);
   if (it != idx.end())
      index.remove(*it);
}

void inductinit(uint64_t id,
                eosio::name inviter,
                eosio::name invitee,
                std::vector<eosio::name> witnesses)
{
   // TODO: expire records
   printf("inductinit %llu\n", id);
   add_or_replace<by_pk>(db.inductions, id, [&](auto& obj) {
      obj.induction.id = id;
      obj.induction.inviter = inviter;
      obj.induction.invitee = invitee;
      obj.induction.witnesses = witnesses;
      dump(obj.induction);
   });
}

void inductprofil(uint64_t id, eden::new_member_profile profile)
{
   printf("inductprofil %llu\n", id);
   add_or_modify<by_pk>(db.inductions, id, [&](auto& obj) {
      obj.induction.id = id;  // !!!
      obj.induction.profile = profile;
      dump(obj.induction);
   });
}

void inductvideo(eosio::name account, uint64_t id, std::string video)
{
   printf("inductvideo %016llx\n", id);
   add_or_modify<by_pk>(db.inductions, id, [&](auto& obj) {
      obj.induction.id = id;  // !!!
      obj.induction.video = video;
      dump(obj.induction);
   });
}

void inductcancel(eosio::name account, uint64_t id)
{
   printf("inductcancel %016llx\n", id);
   remove_if_exists<by_pk>(db.inductions, id);
}

void inductdonate(eosio::name payer, uint64_t id, eosio::asset quantity)
{
   printf("inductdonate %016llx\n", id);
}

template <typename... Args>
void call(void (*f)(Args...), const std::vector<char>& data)
{
   std::tuple<eosio::remove_cvref_t<Args>...> t;
   eosio::input_stream s(data);
   // TODO: prevent abort, indicate what failed
   eosio::from_bin(t, s);
   std::apply([f](auto&&... args) { f(std::move(args)...); }, t);
}

// TODO: configurable contract accounts
void filter_block(const eden_chain::eosio_block& block)
{
   for (auto& trx : block.transactions)
   {
      for (auto& action : trx.actions)
      {
         if (action.firstReceiver == "genesis.eden"_n)
         {
            if (action.name == "inductinit"_n)
               call(inductinit, action.hexData.data);
            else if (action.name == "inductprofil"_n)
               call(inductprofil, action.hexData.data);
            else if (action.name == "inductvideo"_n)
               call(inductvideo, action.hexData.data);
            else if (action.name == "inductcancel"_n)
               call(inductcancel, action.hexData.data);
            else if (action.name == "inductdonate"_n)
               call(inductdonate, action.hexData.data);
         }
      }
   }
}

eden_chain::block_log block_log;

// TODO: prevent from_json from aborting
[[clang::export_name("add_eosio_blocks_json")]] void add_eosio_blocks_json(const char* json,
                                                                           uint32_t size)
{
   std::string str(json, size);
   eosio::json_token_stream s(str.data());
   std::vector<eden_chain::eosio_block> eosio_blocks;
   eosio::from_json(eosio_blocks, s);
   for (auto& eosio_block : eosio_blocks)
   {
      eden_chain::block eden_block;
      eden_block.eosio_block = std::move(eosio_block);
      auto* prev = block_log.block_before_eosio_num(eden_block.eosio_block.num);
      if (prev)
      {
         eden_block.num = prev->block.num + 1;
         eden_block.previous = prev->id;
      }
      else
         eden_block.num = 1;
      auto bin = eosio::convert_to_bin(eden_block);
      eden_chain::block_with_id bi;
      bi.block = std::move(eden_block);
      bi.id = clchain::sha256(bin.data(), bin.size());
      auto status = block_log.add_block(bi);
      // TODO: notify chainbase of forks & irreversible
      filter_block(bi.block.eosio_block);
      // printf("%s block %u %s\n", block_log.status_str[status], bi.block.eosio_block.num,
      //        to_string(bi.block.eosio_block.id).c_str());
   }
   // printf("%d blocks processed, %d blocks now in log\n", (int)eosio_blocks.size(),
   //        (int)block_log.blocks.size());
}

struct Query
{
   eden_chain::block_log* blockLog;  // TODO: fix ref support
};
EOSIO_REFLECT(Query, blockLog)

auto schema = clchain::get_gql_schema<Query>();
[[clang::export_name("get_schema_size")]] uint32_t get_schema_size()
{
   return schema.size();
}
[[clang::export_name("get_schema")]] const char* get_schema()
{
   return schema.c_str();
}

std::string result;
[[clang::export_name("exec_query")]] void exec_query(const char* query, uint32_t size)
{
   Query root{&block_log};
   result = clchain::gql_query(root, {query, size});
}
[[clang::export_name("get_result_size")]] uint32_t get_result_size()
{
   return result.size();
}
[[clang::export_name("get_result")]] const char* get_result()
{
   return result.c_str();
}
