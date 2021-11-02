#pragma once

#include <any>
#include <clarion/dbfwd.hpp>
#include <clarion/identity.hpp>
#include <clarion/keyring.hpp>
#include <clarion/kv_merkle.hpp>
#include <clarion/message_storage.hpp>
#include <clarion/object.hpp>
#include <clarion/octet_string.hpp>
#include <clarion/sync/count_tracker.hpp>
#include <clarion/sync/dedup.hpp>
#include <clarion/sync/generic.hpp>
#include <clarion/sync/identity.hpp>
#include <clarion/sync/tracking.hpp>
#include <cstdint>
#include <queue>
#include <set>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

namespace clarion
{
#if 0
   // addresses are a set
   // goals:
   // - The amount of information stored should not grow indefinitely (No OR sets)
   // - Old addresses should be forgotton
   // - Every node should be able to disconnect and rejoin regardless of what nodes are up at the time. (Each node keeps a full copy of the list.  If a node has a stable address, it will not be removed from the set on disconnection.)
   // Two sets of address
   // - currently active nodes
   // - long-term stable addresses
   struct address_object
   {
      time_point last_seen;
      std::uint32_t priority;
      std::vector<unsigned char> addr;
   };

   struct addresses_object
   {
      std::string name = "addresses";
      // tied to identity block, reset on identity block update
      // subobjects: address_object
   };
#endif

   struct subscription_object
   {
      object_id key;
      bool is_subscribed;
      uint64_t sequence;
      any_hash current_value;
   };

   std::vector<unsigned char> convert_to_bin(const subscription_object& subscription)
   {
      auto result = convert_to_bin(subscription.key);
      result.push_back(subscription.is_subscribed);
      for (int i = 0; i < 8; ++i)
      {
         result.push_back((subscription.sequence >> (i * 8)) & 0xFF);
      }
      result.insert(result.end(), subscription.current_value.hash.begin(),
                    subscription.current_value.hash.end());
      return result;
   }

   template <typename Idx>
   subscription_object merge(Idx& idx,
                             const subscription_object& current,
                             const subscription_object& other)
   {
      bool is_subscribed;
      if (current.sequence == other.sequence)
      {
         is_subscribed = current.is_subscribed || other.is_subscribed;
      }
      else if (current.sequence > other.sequence)
      {
         is_subscribed = current.is_subscribed;
      }
      else
      {
         is_subscribed = other.is_subscribed;
      }
      any_hash hash = is_subscribed ? current.current_value : any_hash{};
      if (!current.is_subscribed && is_subscribed)
      {
         hash = idx.get_hash(current.key);
      }
      return {current.key, is_subscribed, std::max(current.sequence, other.sequence), hash};
   }

   struct object_reference
   {
      std::string index_filename;
      std::string data_filename;
   };

   struct memdb;
   struct index;

   template <typename Hash>
   struct channel_object
   {
      using index_type = flat_merkle<Hash, 4096>;
      using data_type = message_storage<Hash>;
      channel_object(memdb& db, const std::string& index_name, const std::string& data_name);
      index_type& index;
      data_type& data;
      void post(const signing_private_key&, const std::string& body);
      any_hash hash() const { return to_any_hash<Hash>(index.get(index.root())); }
   };

   template <typename Hash>
   struct subscription_storage
   {
      using hash_type = decltype(std::declval<Hash>()("", 0));
      hash_type add(const subscription_object& obj)
      {
         auto bin = convert_to_bin(obj);
         auto hash = Hash()(bin.data(), bin.size());
         subscriptions.emplace(hash, obj);
         return hash;
      }
      const subscription_object* get(const hash_type& key) const
      {
         auto pos = subscriptions.find(key);
         if (pos == subscriptions.end())
         {
            return nullptr;
         }
         else
         {
            return &pos->second;
         }
      }
      std::map<hash_type, subscription_object> subscriptions;
   };

   template <typename Hash>
   struct subscription_set
   {
      using hash_type = decltype(std::declval<Hash>()("", 0));
      using index_type = kv_merkle<octet_string, octet_string_range, Hash>;
      using data_type = subscription_storage<Hash>;
      subscription_set(memdb& db, const std::string& index_name, const std::string& data_name);
      index_type& index;
      data_type& data;
      void subscribe(const clarion::index& idx, const object_id& channel);
      void update(const object_id& channel, const any_hash& new_root);
      any_hash hash() const { return to_any_hash<Hash>(index.get(index.root())); }
   };

   struct identity_object
   {
      identity_object(memdb& db, const std::string& index_name, const std::string& data_name);
      fork_database& db;
      identity get() const { return get_identity(db.get_block_by_index(0)); }
      any_hash hash() const { return to_any_hash<sha256>(db.merkle.get(db.merkle.root())); }
   };

   using object_handle = std::
       variant<std::monostate, channel_object<sha256>, subscription_set<sha256>, identity_object>;

   template <typename T>
   constexpr object_kind kind_of = object_kind::unknown;
   template <>
   constexpr object_kind kind_of<channel_object<sha256>> = object_kind::channel_sha256;
   template <>
   constexpr object_kind kind_of<subscription_set<sha256>> = object_kind::subscriptions_sha256;
   template <>
   constexpr object_kind kind_of<identity_object> = object_kind::identity_sha256;

   struct memdb
   {
      std::map<std::string, std::any> objects;
      template <typename T>
      T& create(const std::string& name)
      {
         auto iter = objects.find(name);
         if (iter == objects.end())
         {
            iter = objects.emplace(name, T{}).first;
         }
         return std::any_cast<T&>(iter->second);
      }
      template <internal_object kind>
      auto& create();
   };

   struct index_object
   {
      any_hash current_value;
      object_reference location;
      object_kind type;
      object_handle handle;
   };

   struct subscriptions_by_channel
   {
      std::set<std::pair<object_id, identity>> subscriptions;
      void subscribe(const identity& id, const object_id& channel)
      {
         subscriptions.emplace(channel, id);
      }
      void unsubscribe(const identity& id, const object_id& channel)
      {
         subscriptions.erase({channel, id});
      }
      void update(memdb& db, index& idx, const object_id& channel, const any_hash& new_root);
   };

   struct index
   {
      std::map<object_id, index_object> objects;
      any_hash get_hash(const object_id& key) const
      {
         auto iter = objects.find(key);
         if (iter != objects.end())
         {
            return iter->second.current_value;
         }
         else
         {
            return {};
         }
      }
      template <typename T>
      object_handle& open(clarion::memdb& db, const clarion::object_id& key)
      {
         auto iter = objects.find(key);
         if (iter == objects.end())
         {
            auto basename = to_string(key);
            auto index_name = basename + ".idx";
            auto data_name = basename + ".dat";
            iter = objects.insert({key, {{}, {index_name, data_name}, kind_of<T>}}).first;
            iter->second.handle.emplace<T>(db, index_name, data_name);
            iter->second.current_value = std::get<T>(iter->second.handle).hash();
         }
         return iter->second.handle;
      }
      object_handle& open(clarion::memdb& db, index_object& entry)
      {
         // TODO: Create a handle if necessary
         return entry.handle;
      }
      object_handle& open(clarion::memdb& db, const clarion::object_id& key)
      {
         auto iter = objects.find(key);
         if (iter == objects.end())
         {
            throw;
         }
         return open(db, iter->second);
      }
      object_handle& open(clarion::memdb& db, const clarion::object_id& key, object_kind type)
      {
         switch (type)
         {
            case object_kind::unknown:
               return open(db, key);
            case object_kind::channel_sha256:
               return open<channel_object<sha256>>(db, key);
            case object_kind::subscriptions_sha256:
               return open<subscription_set<sha256>>(db, key);
            case object_kind::identity_sha256:
               return open<identity_object>(db, key);
         }
         throw;
      }
      index_object* find(const object_id& key)
      {
         auto iter = objects.find(key);
         if (iter == objects.end())
         {
            return nullptr;
         }
         else
         {
            return &iter->second;
         }
      }
      void update(clarion::memdb& db, const clarion::object_id& key, const any_hash& new_root)
      {
         if (auto entry = find(key))
         {
            entry->current_value = new_root;
         }
         db.create<subscriptions_by_channel>("rsubscriptions").update(db, *this, key, new_root);
      }
   };

   template <internal_object kind>
   auto& memdb::create()
   {
      if constexpr (kind == internal_object::index)
      {
         return create<index>("index");
      }
   }

   template <typename Hash>
   channel_object<Hash>::channel_object(memdb& db,
                                        const std::string& index_name,
                                        const std::string& data_name)
       : index(db.create<index_type>(index_name)), data(db.create<data_type>(data_name))
   {
   }

   template <typename Hash>
   subscription_set<Hash>::subscription_set(memdb& db,
                                            const std::string& index_name,
                                            const std::string& data_name)
       : index(db.create<index_type>(index_name)), data(db.create<data_type>(data_name))
   {
   }

   // TODO: Use a single string to initialize the object
   identity_object::identity_object(memdb& db, const std::string& name, const std::string& dummy)
       : db(db.create<fork_database>(name))
   {
   }

   template <typename Hash>
   void subscription_set<Hash>::subscribe(const clarion::index& idx, const object_id& channel)
   {
      auto key = convert_to_bin(channel);
      auto old_hash = index.get({key});
      if (old_hash == hash_type())
      {
         subscription_object new_subscription{channel, true, 0, idx.get_hash(channel)};
         auto new_hash = data.add(new_subscription);
         index.set(key, new_hash);
      }
      else
      {
         auto pos = data.subscriptions.find(old_hash);
         if (pos == data.subscriptions.end())
         {
            // TODO: is this an error?
         }
         if (!pos->second.is_subscribed)
         {
            subscription_object updated_subscription{channel, true, pos->second.sequence,
                                                     idx.get_hash(channel)};
            auto new_hash = data.add(updated_subscription);
            index.set(key, new_hash);
            data.subscriptions.erase(pos);
         }
      }
   }

   template <typename Hash>
   void subscription_set<Hash>::update(const object_id& channel, const any_hash& new_root)
   {
      auto key = convert_to_bin(channel);
      auto old_hash = index.get({key});
      auto pos = data.subscriptions.find(old_hash);
      assert(pos != data.subscriptions.end());
      if (pos->second.is_subscribed)
      {
         subscription_object updated_subscription{channel, true, pos->second.sequence, new_root};
         auto new_hash = data.add(updated_subscription);
         if (new_hash != old_hash)
         {
            index.set(key, new_hash);
            data.subscriptions.erase(pos);
         }
      }
   }

   template <typename Hash>
   void channel_object<Hash>::post(const signing_private_key& key, const std::string& body)
   {
      sequence_number sequence = index.high_sequence + 1;
      signed_message m{{sequence, body}};
      // TODO: serialization format
      m.signature = key.sign(m.data.body.data(), m.data.body.size());
      index.set(sequence, data.add(m));
   }

   inline void subscriptions_by_channel::update(memdb& db,
                                                index& idx,
                                                const object_id& channel,
                                                const any_hash& new_root)
   {
      // TODO: verify that identity{} is actually the least object of its type
      auto iter = subscriptions.lower_bound({channel, identity{}});
      while (iter != subscriptions.end() && iter->first == channel)
      {
         object_id id{iter->second, "clarion.subscriptions"};
         auto& handle = idx.open(db, id);
         auto& s = std::get<subscription_set<sha256>>(handle);
         s.update(channel, new_root);
         idx.update(db, id, s.hash());
         ++iter;
      }
   }

   template <typename Hash, typename Sync>
   auto make_sync(const channel_object<Hash>& channel, Sync& top, const object_id& id)
   {
      auto& ident = top.get_index().open(top.get_db(), {id.owner, "clarion.identity"});
      auto key = std::get<identity_object>(ident).db.head().key;
      return tracking_sync{
          dedup_sync{generic_sync{
                         channel.index, channel.data, [](const auto& m) { return m.data.sequence; },
                         [](const auto& lhs, const auto& rhs) {
                            if (lhs.data.body < rhs.data.body)
                            {
                               return rhs;
                            }
                            else
                            {
                               return lhs;
                            }
                         },
                         [](auto&& arg) { return std::forward<decltype(arg)>(arg); },
                         [key](const signed_message& m) {
                            return verify(key, m.signature, m.data.body.data(), m.data.body.size());
                         }},
                     top.is_initiator()},
          count_tracker<sequence_range>{},
          [&top, &channel, id]() { top.get_index().update(top.get_db(), id, channel.hash()); }};
   }

   template <typename Hash, typename Sync>
   auto make_sync(const subscription_set<Hash>& subscriptions, Sync& top, const object_id& id)
   {
      auto& rs = top.get_db().template create<subscriptions_by_channel>("rsubscriptions");
      auto update_subscription = [&top, &rs, id](const auto& result) {
         if (result.is_subscribed)
         {
            rs.subscribe(id.owner, result.key);
            top.push(result.key);
         }
         else
         {
            rs.unsubscribe(id.owner, result.key);
         }
      };
      return dedup_sync{generic_sync{subscriptions.index, subscriptions.data,
                                     [](const auto& s) { return convert_to_bin(s.key); },
                                     [&top, update_subscription](const auto& lhs, const auto& rhs) {
                                        auto result = merge(top.get_index(), lhs, rhs);
                                        update_subscription(result);
                                        return result;
                                     },
                                     [&top, update_subscription](auto&& arg) {
                                        auto copy = std::forward<decltype(arg)>(arg);
                                        copy.current_value = top.get_index().get_hash(copy.key);
                                        update_subscription(copy);
                                        return copy;
                                     },
                                     [](auto&&) { return true; }},
                        top.is_initiator()};
   }

   inline auto make_sync(const identity_object& id)
   {
      return dedup_sync{identity_sync<sha256>(id.db)};
   }

}  // namespace clarion
