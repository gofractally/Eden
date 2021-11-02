#pragma once

#include <algorithm>
#include <clarion/sync/dispatch.hpp>
#include <type_traits>
#include <utility>
#include <vector>

namespace clarion
{
   // given two roots, ancestor and descendant, I can send, receive, or skip each. order matters
   //
   // protocol:
   // - block recusion into roots that I send
   // - skip roots that are children of any known root
   // - One peer is designated as blocking response to roots that it sent
   //
   // (a) send A: peer is (h)
   // (b) send A, receive D: peer is (d) or (j)
   // (c) send A, send D: disallowed
   // (d) send A, skip D: okay
   // (e) receive A: peer is (d)
   // (f) receive A, receive D: peer is (c) or (k)
   // (g) receive A, send D: disallowed
   // (h) receive A, skip D: okay
   // (i) send D: peer is (p)
   // (j) send D, receive A: block recursion
   // (k) send D, send A: block recursion
   // (l) send D, skip A: disallowed
   // (m) receive D: peer is (l)
   // (n) receive D, receive A: peer is (c) or (k)
   // (o) receive D, send A: peer is (j)
   // (p) receive D, skip A: disallowed

   template <typename Sync>
   struct dedup_sync
   {
      using root_message = Sync::root_message;
      using node_message = Sync::node_message;
      using ack_message = Sync::ack_message;
      using leaf_message = Sync::leaf_message;
      using range_type = decltype(node_message::range);
      using hash_type = decltype(node_message::hash);
      template <typename T>
      auto key_extractor(T&& arg) const
      {
         return impl.key_extractor(std::forward<T>(arg));
      }
      bool has_pending() const { return impl.has_pending(); }
      template <typename F>
      void start(F&& f)
      {
         return clarion::start(impl, wrap(f));
      }
      template <typename Msg, typename F>
      bool recv(const Msg& msg, F&& out)
      {
         if constexpr (std::is_same_v<Msg, node_message>)
         {
            if (msg.hash == hash_type{})
            {
               if (std::find(outgoing.begin(), outgoing.end(), msg.range) == outgoing.end())
               {
                  outgoing.push_back(msg.range);
               }
               else
               {
                  out(ack_message{msg.range});
                  return false;
               }
            }
            else if (std::find(local.begin(), local.end(), msg.range) != local.end())
            {
               out(ack_message{msg.range});
               return false;
            }
         }
         if constexpr (std::is_same_v<Msg, root_message>)
         {
            if (priority)
            {
               if (std::find(local.begin(), local.end(), msg.range) != local.end())
               {
                  out(ack_message{msg.range});
                  return false;
               }
            }
            remote.push_back(msg.range);
         }
         return clarion::recv(impl, msg, wrap(out));
      }
      template <typename F>
      bool send(F&& out)
      {
         return clarion::send(impl, wrap(out));
      }
      template <typename F>
      auto wrap(F&& f)
      {
         return [&](auto&& msg) {
            using message_type = std::decay_t<decltype(msg)>;
            if constexpr (std::is_same_v<message_type, root_message>)
            {
               for (auto& roots : {local, remote})
               {
                  for (auto& r : roots)
                  {
                     if (contains(r, msg.range))
                     {
                        return;
                     }
                  }
               }
               local.push_back(msg.range);
            }
            else if constexpr (std::is_same_v<message_type, node_message>)
            {
               if (std::find(local.begin(), local.end(), msg.range) != local.end())
               {
                  f(ack_message{msg.range});
                  return;
               }
            }
            f(std::forward<decltype(msg)>(msg));
         };
      }
      Sync impl;
      bool priority;
      std::vector<range_type> local;
      std::vector<range_type> remote;
      std::vector<range_type> outgoing;
   };
}  // namespace clarion
