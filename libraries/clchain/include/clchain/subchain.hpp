#pragma once

#include <clchain/graphql_connection.hpp>
#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/time.hpp>

namespace subchain
{
   struct creator_action
   {
      double seq;
      eosio::name receiver;
   };
   EOSIO_REFLECT(creator_action, seq, receiver)

   struct action
   {
      uint64_t seq = 0;
      eosio::name firstReceiver;
      eosio::name receiver;
      eosio::name name;
      std::optional<creator_action> creatorAction;
      eosio::bytes hexData;
   };
   EOSIO_REFLECT(action, seq, firstReceiver, receiver, name, creatorAction, hexData)

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
      eosio_block eosioBlock;
   };
   EOSIO_REFLECT(block, num, previous, eosioBlock)

   struct block_with_id : block
   {
      eosio::checksum256 id;
   };
   EOSIO_REFLECT(block_with_id, id, base block)

   inline const block& deref(const block& block) { return block; }
   inline const block& deref(const std::unique_ptr<block>& block) { return *block; }
   inline const block_with_id& deref(const block_with_id& block) { return block; }
   inline const block_with_id& deref(const std::unique_ptr<block_with_id>& block) { return *block; }
   inline uint32_t get_eosio_num(uint32_t num) { return num; }
   inline uint32_t get_eosio_num(const auto& block) { return deref(block).eosioBlock.num; }
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

      auto lower_bound_by_num(uint32_t num) const
      {
         if (blocks.empty())
            return blocks.end();
         auto head = blocks.front()->num;
         if (num <= head)
            return blocks.begin();
         if (num - head < blocks.size())
            return blocks.begin() + (num - head);
         return blocks.end();
      }

      auto upper_bound_by_num(uint32_t num) const
      {
         if (num == ~uint32_t(0))
            return blocks.end();
         return lower_bound_by_num(num + 1);
      }

      const block_with_id* head() const
      {
         if (blocks.empty())
            return nullptr;
         return &*blocks.back();
      }

      const block_with_id* block_by_num(uint32_t num) const
      {
         auto it = lower_bound_by_num(num);
         if (it != blocks.end() && (*it)->num == num)
            return &**it;
         return nullptr;
      }

      const block_with_id* block_by_eosio_num(uint32_t num) const
      {
         auto it = std::lower_bound(blocks.begin(), blocks.end(), num, by_eosio_num);
         if (it != blocks.end() && get_eosio_num(*it) == num)
            return &**it;
         return nullptr;
      }

      const block_with_id* block_before_num(uint32_t num) const
      {
         auto it = lower_bound_by_num(num);
         if (it != blocks.begin())
            return &*it[-1];
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
         auto it = lower_bound_by_num(block.num);
         if (it != blocks.end() && block.id == it[0]->id)
            return {duplicate, 0};
         if (it == blocks.begin() && block.num != 1)
            return {unlinkable, 0};
         if (it != blocks.begin())
            if (block.previous != it[-1]->id || block.num != it[-1]->num + 1)
               return {unlinkable, 0};
         if (it != blocks.end() && it[0]->num <= irreversible)
            return {unlinkable, 0};
         num_forked = blocks.end() - it;
         blocks.erase(it, blocks.end());
         blocks.push_back(std::make_unique<block_with_id>(block));
         return {appended, num_forked};
      }

      size_t undo(uint32_t block_num)
      {
         if (block_num <= irreversible)
            return 0;
         auto it = lower_bound_by_num(block_num);
         if (it == blocks.end() || it[0]->num != block_num)
            return 0;
         size_t num_removed = blocks.end() - it;
         blocks.erase(it, blocks.end());
         return num_removed;
      }

      // Keep only 1 irreversible block
      void trim()
      {
         auto it = lower_bound_by_num(irreversible);
         blocks.erase(blocks.begin(), it);
      }
   };
   EOSIO_REFLECT2(block_log, blocks, irreversible)

   constexpr inline const char BlockConnection_name[] = "BlockConnection";
   constexpr inline const char BlockEdge_name[] = "BlockEdge";
   using BlockConnection =
       clchain::Connection<clchain::ConnectionConfig<std::reference_wrapper<const block_with_id>,
                                                     BlockConnection_name,
                                                     BlockEdge_name>>;

   struct BlockLog
   {
      block_log& log;

      BlockConnection blocks(std::optional<uint32_t> gt,
                             std::optional<uint32_t> ge,
                             std::optional<uint32_t> lt,
                             std::optional<uint32_t> le,
                             std::optional<uint32_t> first,
                             std::optional<uint32_t> last,
                             std::optional<std::string> before,
                             std::optional<std::string> after) const
      {
         return clchain::make_connection<BlockConnection, uint32_t>(
             gt, ge, lt, le, first, last, before, after,     //
             log.blocks,                                     //
             [](auto& block) { return block->num; },         //
             [](auto& block) { return std::cref(*block); },  //
             [&](auto& blocks, auto block_num) { return log.lower_bound_by_num(block_num); },
             [&](auto& blocks, auto block_num) { return log.upper_bound_by_num(block_num); });
      }

      const block_with_id* head() const { return log.head(); }
      const block_with_id* irreversible() const { return log.block_by_num(log.irreversible); }
      const block_with_id* blockByNum(uint32_t num) const { return log.block_by_num(num); }
      const block_with_id* blockByEosioNum(uint32_t num) const
      {
         return log.block_by_eosio_num(num);
      }
   };
   EOSIO_REFLECT2(BlockLog,
                  method(blocks, "gt", "ge", "lt", "le", "first", "last", "before", "after"),
                  head,
                  irreversible,
                  method(blockByNum, "num"),
                  method(blockByEosioNum, "num"))

}  // namespace subchain
