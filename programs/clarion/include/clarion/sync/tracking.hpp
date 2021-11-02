#pragma once

#include <clarion/sync/dispatch.hpp>

namespace clarion
{
   /**
    * This class wraps a channel sync object to add tracking of outgoing messages
    * for which a reply is expected.
    */
   template <typename Sync, typename Tracker, typename CompletionHandler>
   struct tracking_sync
   {
      using root_message = Sync::root_message;
      using node_message = Sync::node_message;
      using ack_message = Sync::ack_message;
      using leaf_message = Sync::leaf_message;
      using range_type = decltype(node_message::range);
      template <typename F>
      void start(F&& f)
      {
         return clarion::start(impl, wrap(f));
      }
      template <typename Msg, typename F>
      bool recv(const Msg& msg, F&& out)
      {
         if constexpr (std::is_same_v<Msg, leaf_message>)
         {
            tracker -= range_type{impl.key_extractor(msg.contents)};
         }
         else if constexpr (!std::is_same_v<Msg, root_message>)
         {
            tracker -= msg.range;
         }
         bool result = clarion::recv(impl, msg, wrap(out));
         if (!impl.has_pending() && tracker.empty())
         {
            done();
         }
         return result;
      }
      template <typename F>
      bool send(F&& out)
      {
         bool result = clarion::send(impl, wrap(out));
         if (!result && tracker.empty())
         {
            done();
         }
         return result;
      }
      template <typename F>
      auto wrap(F&& f)
      {
         return [&](auto&& msg) {
            using message_type = std::decay_t<decltype(msg)>;
            if constexpr (std::is_same_v<message_type, leaf_message>)
            {
               tracker += range_type{impl.key_extractor(msg.contents)};
            }
            else if constexpr (!std::is_same_v<message_type, ack_message>)
            {
               tracker += msg.range;
            }
            f(std::forward<decltype(msg)>(msg));
         };
      }
      Sync impl;
      Tracker tracker;
      CompletionHandler done;
   };
}  // namespace clarion
