#pragma once

#include <clchain/subchain.hpp>
#include <eosio/tester.hpp>
#include <fstream>

namespace dfuse_subchain
{
   struct block
   {
      uint32_t num;
      eosio::checksum256 id;
      eosio::block_timestamp timestamp;
      eosio::checksum256 previous;
   };
   EOSIO_REFLECT(block, num, id, timestamp, previous)

   struct action
   {
      double seq;
      eosio::name receiver;
      eosio::name account;
      eosio::name name;
      eosio::bytes hexData;
   };
   EOSIO_REFLECT(action, seq, receiver, account, name, hexData)

   struct trace
   {
      eosio::checksum256 id;
      std::vector<action> matchingActions;
   };
   EOSIO_REFLECT(trace, id, matchingActions)

   struct transaction
   {
      bool undo = false;
      std::string cursor;
      uint32_t irreversibleBlockNum = 0;
      block block;
      trace trace;
   };
   EOSIO_REFLECT(transaction, undo, cursor, irreversibleBlockNum, block, trace)

   void add_transactions(std::vector<transaction>& transactions,
                         const eosio::test_chain::get_history_result& result)
   {
      block block{
          .num = result.result.this_block->block_num,
          .id = result.result.this_block->block_id,
          .timestamp = result.block->timestamp,
          .previous = result.block->previous,
      };
      for (auto& ttrace : result.traces)
      {
         std::visit(
             [&](auto& ttrace) {
                eosio::check(result.result.this_block.has_value(), "missing this_block");
                eosio::check(result.block.has_value(), "missing block");
                transaction t;
                t.irreversibleBlockNum = result.result.last_irreversible.block_num;
                t.block = block;
                t.trace.id = ttrace.id;
                for (auto& atrace : ttrace.action_traces)
                {
                   std::visit(
                       [&](auto& atrace) {
                          eosio::check(atrace.receipt.has_value(), "missing receipt");
                          action a;
                          std::visit([&](auto& receipt) { a.seq = receipt.global_sequence; },
                                     *atrace.receipt);
                          a.receiver = atrace.receiver;
                          a.account = atrace.act.account;
                          a.name = atrace.act.name;
                          a.hexData.data.insert(a.hexData.data.end(), atrace.act.data.pos,
                                                atrace.act.data.end);
                          t.trace.matchingActions.push_back(std::move(a));
                       },
                       atrace);
                }
                transactions.push_back(std::move(t));
             },
             ttrace);
      }
      if (result.traces.empty())
         transactions.push_back({.block = block});
   }

   uint32_t write_history(const char* filename, eosio::test_chain& chain)
   {
      uint32_t last_block = 1;
      std::vector<transaction> transactions;
      while (auto history = chain.get_history(last_block + 1))
      {
         add_transactions(transactions, *history);
         ++last_block;
      }
      std::ofstream(filename) << eosio::convert_to_json(transactions);
      return last_block;
   }

}  // namespace dfuse_subchain
