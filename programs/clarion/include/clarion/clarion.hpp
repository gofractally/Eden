#pragma once

#include <clarion/memdb.hpp>

namespace clarion
{
   struct node
   {
      memdb db;
      clarion::identity identity;

      template <typename T>
      T& get_or_create_channel(clarion::index& index, const clarion::object_id& channel)
      {
         return std::get<T>(index.open<T>(db, channel));
      }

      auto create_identity(clarion::signature_kind key_type,
                           clarion::hash_kind hash_type,
                           std::size_t num_friends = 8)
      {
         auto& index = db.create<clarion::index>("index");
         auto& keys = db.create<clarion::keyring>("keyring");
         auto id = clarion::new_identity(keys, key_type, hash_type, num_friends);
         auto& result = get_or_create_channel<clarion::identity_object>(
             index, {get_identity(id), "clarion.identity"});
         result.db.add({{id}});
         return result.get();
      }

      void subscribe(const clarion::identity& subscriber, const clarion::object_id& channel)
      {
         auto& index = db.create<clarion::index>("index");
         // lookup subscriptions
         clarion::object_id key{subscriber, "clarion.subscriptions"};
         auto& subscriptions =
             get_or_create_channel<clarion::subscription_set<clarion::sha256>>(index, key);
         subscriptions.subscribe(index, channel);
         auto& rsubscriptions = db.create<clarion::subscriptions_by_channel>("rsubscriptions");
         rsubscriptions.subscribe(subscriber, channel);
      }

      void post(const clarion::object_id& channel, const std::string& body)
      {
         auto& index = db.create<clarion::index>("index");
         auto& keys = db.create<clarion::keyring>("keyring");
         auto pub =
             std::get<clarion::identity_object>(index.open(db, {channel.owner, "clarion.identity"}))
                 .db.head()
                 .key;
         auto* priv = keys.find_private_key(pub);
         if (!priv)
         {
            throw std::runtime_error(
                "Cannot post to this channel.  Owner key not present in keyring.");
         }
         auto& c = get_or_create_channel<clarion::channel_object<clarion::sha256>>(index, channel);
         c.post(*priv, body);
         index.update(db, channel, c.hash());
      }
   };
}  // namespace clarion
