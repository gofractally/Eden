#pragma once

#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/time.hpp>

namespace eden_chain
{
   struct action
   {
      uint64_t seq = 0;
      eosio::name firstReceiver;
      eosio::name receiver;
      eosio::name name;
      eosio::bytes hexData;
   };
   EOSIO_REFLECT(action, seq, firstReceiver, receiver, name, hexData)

   struct transaction
   {
      eosio::checksum256 id;
      std::vector<action> actions;
   };
   EOSIO_REFLECT(transaction, id, actions)

   struct eosio_block
   {
      uint32_t num = 0;
      eosio::checksum256 id;
      eosio::checksum256 previous;
      eosio::time_point timestamp;
      std::vector<transaction> transactions;
   };
   EOSIO_REFLECT(eosio_block, num, id, previous, timestamp, transactions)

   struct block
   {
      uint32_t num = 0;
      eosio::checksum256 previous;
      eosio_block eosio_block;
   };
   EOSIO_REFLECT(block, num, previous, eosio_block)

   struct block_with_id
   {
      block block;
      eosio::checksum256 id;
   };
   EOSIO_REFLECT(block_with_id, block, id)

   inline const block& deref(const block& block) { return block; }
   inline const block& deref(const std::unique_ptr<block>& block) { return *block; }
   inline uint32_t get_block_num(uint32_t num) { return num; }
   inline uint32_t get_block_num(const auto& block) { return deref(block).block.num; }
   inline constexpr auto by_block_num = [](const auto& a, const auto& b) {
      return get_block_num(a) < get_block_num(b);
   };

   inline const block_with_id& deref(const block_with_id& block) { return block; }
   inline const block_with_id& deref(const std::unique_ptr<block_with_id>& block) { return *block; }
   inline uint32_t get_eosio_num(uint32_t num) { return num; }
   inline uint32_t get_eosio_num(const auto& block) { return deref(block).block.eosio_block.num; }
   inline constexpr auto by_eosio_num = [](const auto& a, const auto& b) {
      return get_eosio_num(a) < get_eosio_num(b);
   };

   struct block_log
   {
      enum status
      {
         appended,
         forked,
         duplicate,
         unlinkable,
      };
      std::vector<std::unique_ptr<block_with_id>> blocks;

      status add_block(const block_with_id& block)
      {
         auto it = std::lower_bound(blocks.begin(), blocks.end(), block, by_block_num);
         if (it != blocks.end() && it[0]->id == block.id)
            return duplicate;
         auto result = appended;
         if (it == blocks.begin())
         {
            if (!blocks.empty() || block.block.num != 1)
               return unlinkable;
         }
         else
         {
            if (block.block.previous != it[-1]->id)
               return unlinkable;
            if (it != blocks.end())
            {
               blocks.erase(it, blocks.end());
               result = forked;
            }
         }
         blocks.push_back(std::make_unique<block_with_id>(block));
         return result;
      }
   };
   EOSIO_REFLECT(block_log, blocks)

}  // namespace eden_chain
