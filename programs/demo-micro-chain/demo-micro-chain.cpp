#include <clchain/crypto.hpp>
#include <clchain/eden_chain.hpp>
#include <clchain/graphql.hpp>
#include <eosio/to_bin.hpp>

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
      // printf("%s block %u %s\n", block_log.status_str[status], bi.block.eosio_block.num,
      //        to_string(bi.block.eosio_block.id).c_str());
   }
   printf("%d blocks processed, %d blocks now in log\n", (int)eosio_blocks.size(),
          (int)block_log.blocks.size());
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
