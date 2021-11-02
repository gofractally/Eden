#pragma once

#include <clarion/dbfwd.hpp>
#include <clarion/sync/dispatch.hpp>
#include <clarion/sync/message_types.hpp>
#include <cstdint>
#include <map>
#include <memory>
#include <queue>
#include <utility>
#include <variant>
#include <vector>

namespace clarion
{
   enum class sync_message_kind : std::uint32_t
   {
      bind,
      root,
      node,
      leaf,
      null,
      ack
   };

   template <typename Out>
   struct any_sync
   {
      std::uint64_t outgoing_stream;
      virtual bool recv(sync_message_kind type, const void* data, std::size_t size, Out& out) = 0;
      virtual bool send(Out& out) = 0;
      virtual void start(Out& out) = 0;
   };
   template <typename T, typename Out>
   struct any_sync_impl : any_sync<Out>
   {
      any_sync_impl(T&& init) : impl(std::move(init)) {}
      bool recv(sync_message_kind type, const void* data, std::size_t size, Out& out) override
      {
         auto out_fn = wrap(out);
         // TODO: proper serialization...
         switch (type)
         {
            case sync_message_kind::root:
               return clarion::recv(impl, *static_cast<const T::root_message*>(data), out_fn);
            case sync_message_kind::node:
               return clarion::recv(impl, *static_cast<const T::node_message*>(data), out_fn);
            case sync_message_kind::leaf:
               return clarion::recv(impl, *static_cast<const T::leaf_message*>(data), out_fn);
            case sync_message_kind::ack:
               return clarion::recv(impl, *static_cast<const T::ack_message*>(data), out_fn);
         }
         return false;
      }
      bool send(Out& out) override { return clarion::send(impl, wrap(out)); }
      void start(Out& out) override { clarion::start(impl, wrap(out)); }
      auto wrap(Out& out)
      {
         return [&](auto&& arg) {
            using arg_type = std::decay_t<decltype(arg)>;
            sync_message_kind output_type;
            if constexpr (std::is_same_v<typename T::root_message, arg_type>)
            {
               output_type = sync_message_kind::root;
            }
            else if constexpr (std::is_same_v<typename T::node_message, arg_type>)
            {
               output_type = sync_message_kind::node;
            }
            else if constexpr (std::is_same_v<typename T::leaf_message, arg_type>)
            {
               output_type = sync_message_kind::leaf;
            }
            else if constexpr (std::is_same_v<typename T::ack_message, arg_type>)
            {
               output_type = sync_message_kind::ack;
            }
            out(this->outgoing_stream, output_type, std::forward<decltype(arg)>(arg));
         };
      }
      T impl;
   };

   template <typename Db, typename Out>
   struct sync;

   template <typename Db, typename Out, typename T>
   auto make_sync(T& t, sync<Db, Out>&) -> decltype(make_sync(t))
   {
      return make_sync(t);
   }

   template <typename Db, typename Out, typename T>
   auto make_sync(T& t, sync<Db, Out>& top, const object_id&) -> decltype(make_sync(t, top))
   {
      return make_sync(t, top);
   }

   template <typename Db, typename Out, typename T>
   auto make_any_sync(const T& t, sync<Db, Out>& top, const object_id& id)
   {
      auto result = make_sync(t, top, id);
      return std::make_shared<any_sync_impl<decltype(result), Out>>(std::move(result));
   }

   template <typename Db, typename Out>
   std::shared_ptr<any_sync<Out>> make_any_sync(const std::monostate&,
                                                sync<Db, Out>&,
                                                const object_id&)
   {
      throw;
   }

   template <typename Db, typename Out, typename... T>
   auto make_any_sync(const std::variant<T...>& handle, sync<Db, Out>& top, const object_id& id)
   {
      return std::visit(
          [&](const auto& x) {
             return static_cast<std::shared_ptr<any_sync<Out>>>(make_any_sync(x, top, id));
          },
          handle);
   }

   // This class manages the connection used to synchronize this node with another node.
   // The caller is responsible for data transport.
   template <typename Db, typename Out>
   class sync
   {
      std::vector<std::shared_ptr<any_sync<Out>>> streams_in;
      std::vector<uint64_t> free_streams;
      std::queue<std::shared_ptr<any_sync<Out>>> streams_pending;
      std::map<object_id, std::shared_ptr<any_sync<Out>>> open_objects;
      std::queue<object_id> queued_objects;
      Db& db;
      decltype(db.template create<internal_object::index>()) idx;
      Out out;
      std::uint64_t next_stream = 0;
      bool initiator;

     public:
      /**
       * \param db The database for this node
       * \param out is a function that is responsible for serializing and sending messages to the outgoing stream.
       * \param initiator should be true for one end of the connection and false for the other
       *
       * The expected signature of out is:
       * \code
       * void operator()(uint64_t stream, sync_message_kind, auto message);
       * \endcode
       *
       * out must not reenter any function of this object
       */
      sync(Db& db, Out&& out, bool initiator)
          : db(db),
            idx(db.template create<internal_object::index>()),
            out(std::move(out)),
            initiator(initiator)
      {
      }
      /**
       * Processes a single incoming message.  A bounded number of messages may be sent to the output stream.
       * \return true if there are pending outgoing messages after the call, but not before.
       */
      bool recv(uint64_t stream, sync_message_kind type, const void* data, std::size_t size)
      {
         bool old_pending = has_pending();
         if (stream >= streams_in.size())
         {
            // TODO: enforce limit
            streams_in.resize(stream + 1);
         }
         if (type == sync_message_kind::bind)
         {
            const auto* msg = static_cast<const bind_message*>(data);
            streams_in[stream] = get_or_create_stream(msg->id, msg->type, out);
         }
         else if (type == sync_message_kind::null)
         {
            // TODO: we know that the peer has nothing
            streams_in[stream]->start(out);
         }
         else
         {
            if (!streams_in[stream])
            {
               // TODO: error because peer data stream is malformed
            }
            if (streams_in[stream]->recv(type, data, size, out))
            {
               streams_pending.push(streams_in[stream]);
            }
         }
         return !old_pending && has_pending();
      }
      /**
       * \return true iff there are queued messages waiting to be sent
       */
      bool has_pending() const { return !queued_objects.empty() || !streams_pending.empty(); }
      /**
       * Sends a bounded number of queued messages to the output stream
       * \pre has_pending()
       */
      bool send()
      {
         if (streams_pending.empty())
         {
            start_sync(queued_objects.front(), out);
            queued_objects.pop();
         }
         else if (!streams_pending.front()->send(out))
         {
            streams_pending.pop();
         }
         return has_pending();
      }
      /**
       * Adds a channel to by synchronized.  This function is safe to call
       * within channel synchronization.
       */
      void push(const object_id& id) { queued_objects.push(id); }
      Db& get_db() { return db; }
      auto& get_index() { return idx; }
      bool is_initiator() const { return initiator; }

     private:
      uint64_t allocate_stream()
      {
         if (free_streams.empty())
         {
            return next_stream++;
         }
         else
         {
            std::uint64_t result = free_streams.back();
            free_streams.pop_back();
            return result;
         }
      }
      void free_stream(std::uint64_t stream) { free_streams.push_back(stream); }
      std::shared_ptr<any_sync<Out>> get_or_create_stream(const object_id& id,
                                                          object_kind type,
                                                          Out& out)
      {
         auto iter = open_objects.find(id);
         if (iter == open_objects.end())
         {
            if (type != object_kind::unknown)
            {
               iter =
                   open_objects.emplace(id, make_any_sync(idx.open(db, id, type), *this, id)).first;
            }
            else if (auto* index_entry = idx.find(id))
            {
               type = index_entry->type;
               iter = open_objects.emplace(id, make_any_sync(idx.open(db, *index_entry), *this, id))
                          .first;
            }
            else
            {
               return nullptr;
            }

            auto stream = allocate_stream();
            out(stream, sync_message_kind::bind, bind_message{id, type});
            iter->second->outgoing_stream = stream;
         }
         return iter->second;
      }
      void start_sync(const object_id& id, Out& out)
      {
         auto stream = get_or_create_stream(id, object_kind::unknown, out);
         if (stream)
         {
            stream->start(out);
         }
         else
         {
            auto stream = allocate_stream();
            out(stream, sync_message_kind::bind, bind_message{id, object_kind::unknown});
            out(stream, sync_message_kind::null, null_message{});
            free_stream(stream);
         }
      }
   };
}  // namespace clarion
