#pragma once

#include <clarion/identity.hpp>
#include <clarion/sync/message_types.hpp>
#include <deque>
#include <utility>

namespace clarion
{
   template <typename Hash>
   struct identity_sync
   {
      fork_database& db;
      flat_merkle<Hash, 4096>& merkle = db.merkle;
      using range_type = sequence_range;
      using hash_type = decltype(std::declval<Hash>()("", 0));
      using data_type = identity_block_group;
      using root_message = clarion::root_message<range_type, hash_type>;
      using node_message = clarion::node_message<range_type, hash_type>;
      using ack_message = clarion::ack_message<range_type>;
      using leaf_message = clarion::leaf_message<data_type>;
      std::deque<range_type> outbox;
      template <typename F>
      bool recv(const leaf_message& in, F&& out)
      {
         auto key = in.contents.blocks.front().height;
         auto* old_value = db.get_group_by_index(key);
         const auto& new_contents = db.add(in.contents);

         if (old_value && *old_value == new_contents)
         {
            out(leaf_message{new_contents});
         }
         else
         {
            out(ack_message{range_type{key}});
         }
         return false;
      }
      template <typename F>
      void send(const range_type& r, F&& out)
      {
         if (auto msg = db.get_group_by_index(outbox.front().start))
         {
            out(leaf_message{*msg});
         }
         else
         {
            out(ack_message{r});
         }
      }
   };
}  // namespace clarion
