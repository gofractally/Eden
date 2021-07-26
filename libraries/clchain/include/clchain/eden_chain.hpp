#pragma once

#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection2.hpp>
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

   struct block_with_id : block
   {
      eosio::checksum256 id;
   };
   EOSIO_REFLECT(block_with_id, id, base block)

   inline const block& deref(const block& block) { return block; }
   inline const block& deref(const std::unique_ptr<block>& block) { return *block; }
   inline uint32_t get_block_num(uint32_t num) { return num; }
   inline uint32_t get_block_num(const auto& block) { return deref(block).num; }
   inline constexpr auto by_block_num = [](const auto& a, const auto& b) {
      return get_block_num(a) < get_block_num(b);
   };

   inline const block_with_id& deref(const block_with_id& block) { return block; }
   inline const block_with_id& deref(const std::unique_ptr<block_with_id>& block) { return *block; }
   inline uint32_t get_eosio_num(uint32_t num) { return num; }
   inline uint32_t get_eosio_num(const auto& block) { return deref(block).eosio_block.num; }
   inline constexpr auto by_eosio_num = [](const auto& a, const auto& b) {
      return get_eosio_num(a) < get_eosio_num(b);
   };

   struct block_log
   {
      enum status
      {
         appended,
         duplicate,
         unlinkable,
      };

      static constexpr const char* status_str[] = {
          "appended",
          "duplicate",
          "unlinkable",
      };

      std::vector<std::unique_ptr<block_with_id>> blocks;
      uint32_t irreversible = 0;

      const block_with_id* blockByEosioNum(uint32_t num) const
      {
         auto it = std::lower_bound(blocks.begin(), blocks.end(), num, by_eosio_num);
         if (it != blocks.end() && get_eosio_num(*it) == num)
            return &**it;
         return nullptr;
      }

      const block_with_id* block_before_eosio_num(uint32_t num) const
      {
         auto it = std::lower_bound(blocks.begin(), blocks.end(), num, by_eosio_num);
         if (it != blocks.begin())
            return &*it[-1];
         return nullptr;
      }

      std::pair<status, size_t> add_block(const block_with_id& block)
      {
         size_t num_forked = 0;
         auto it = std::lower_bound(blocks.begin(), blocks.end(), block, by_block_num);
         if (it != blocks.end() && block.id == it[0]->id)
            return {duplicate, 0};
         if (it == blocks.begin() && block.num != 1)
            return {unlinkable, 0};
         if (it != blocks.begin())
         {
            if (block.previous != it[-1]->id || block.num != it[-1]->num + 1)
               return {unlinkable, 0};
            if (it != blocks.end() && it[0]->num <= irreversible)
               return {unlinkable, 0};
         }
         num_forked = blocks.end() - it;
         blocks.erase(it, blocks.end());
         blocks.push_back(std::make_unique<block_with_id>(block));
         return {appended, num_forked};
      }

      // Keep only 1 irreversible block
      void trim()
      {
         auto it = std::lower_bound(blocks.begin(), blocks.end(), irreversible, by_block_num);
         blocks.erase(blocks.begin(), it);
      }
   };
   EOSIO_REFLECT2(block_log, blocks, irreversible, method(blockByEosioNum, "num"))

}  // namespace eden_chain
