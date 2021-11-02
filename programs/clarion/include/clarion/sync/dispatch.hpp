#pragma once

#include <experimental/type_traits>
#include <utility>

namespace clarion
{
   template <typename Sync, typename F>
   using has_start_impl = decltype(std::declval<Sync>().start(std::declval<F>()));

   template <typename Sync, typename F>
   constexpr bool has_start = std::experimental::is_detected_v<has_start_impl, Sync, F>;

   template <typename Sync, typename F>
   auto start(Sync& sync, F&& out) -> std::enable_if_t<has_start<Sync, F>>
   {
      return sync.start(std::forward<F>(out));
   }

   template <typename Sync, typename F>
   auto start(Sync& sync, F&& out) -> std::enable_if_t<!has_start<Sync, F>>
   {
      auto root = sync.merkle.root();
      out(typename Sync::root_message(root, sync.merkle.get(root)));
   }

   template <typename Sync, typename Msg, typename F>
   using has_recv_impl =
       decltype(std::declval<Sync>().recv(std::declval<Msg>(), std::declval<F>()));

   template <typename Sync, typename Msg, typename F>
   constexpr bool has_recv = std::experimental::is_detected_v<has_recv_impl, Sync, Msg, F>;

   template <typename Sync, typename Msg, typename F>
   auto recv(Sync& sync, Msg&& in, F&& out) -> std::enable_if_t<has_recv<Sync, Msg, F>, bool>
   {
      return sync.recv(std::forward<Msg>(in), std::forward<F>(out));
   }

   template <typename Sync, typename F>
   auto recv(Sync& sync, const typename Sync::root_message& in, F&& out)
       -> std::enable_if_t<!has_recv<Sync, const typename Sync::root_message&, F>, bool>
   {
      return recv(sync, typename Sync::node_message{in.range, in.hash}, std::forward<F>(out));
   }

   template <typename Sync, typename F>
   auto recv(Sync& sync, const typename Sync::node_message& in, F&& out)
       -> std::enable_if_t<!has_recv<Sync, const typename Sync::node_message&, F>, bool>
   {
      using hash_type = typename Sync::hash_type;
      const auto& hash = sync.merkle.get(in.range);
      if (hash != in.hash)
      {
         if (hash == hash_type())
         {
            out(typename Sync::node_message(in.range, hash));
            return false;
         }
         else if (in.hash == hash_type())
         {
            bool result = sync.outbox.empty();
            sync.outbox.push_back(in.range);
            return result;
         }
         else
         {
            if (is_leaf(in.range))
            {
               bool result = sync.outbox.empty();
               sync.outbox.push_back(in.range);
               return result;
            }
            else
            {
               auto [l, r] = split(in.range);
               out(typename Sync::node_message{l, sync.merkle.get(l)});
               out(typename Sync::node_message{r, sync.merkle.get(r)});
               return false;
            }
         }
      }
      else
      {
         out(typename Sync::ack_message{in.range});
         return false;
      }
   }

   template <typename Sync, typename F>
   auto recv(Sync& sync, const typename Sync::ack_message& in, F&& out)
       -> std::enable_if_t<!has_recv<Sync, const typename Sync::ack_message&, F>, bool>
   {
      return false;
   }

   template <typename Sync, typename F>
   using has_send_impl = decltype(std::declval<Sync>().send(std::declval<F>()));

   template <typename Sync, typename F>
   constexpr bool has_send = std::experimental::is_detected_v<has_send_impl, Sync, F>;

   template <typename Sync, typename F>
   auto send(Sync& sync, F&& out) -> std::enable_if_t<has_send<Sync, F>, bool>
   {
      return sync.send(std::forward<F>(out));
   }

   template <typename Sync, typename F>
   auto send(Sync& sync, F&& out) -> std::enable_if_t<!has_send<Sync, F>, bool>
   {
      using hash_type = typename Sync::hash_type;
      while (!is_leaf(sync.outbox.front()))
      {
         auto [l, r] = split(sync.outbox.front());
         sync.outbox.pop_front();
         for (auto range : {r, l})
         {
            if (auto hash = sync.merkle.get(range); hash != hash_type())
            {
               sync.outbox.push_front(range);
            }
            else
            {
               out(typename Sync::ack_message{range});
            }
         }
      }
      sync.send(sync.outbox.front(), std::forward<F>(out));
      sync.outbox.pop_front();
      return !sync.outbox.empty();
   }
}  // namespace clarion
