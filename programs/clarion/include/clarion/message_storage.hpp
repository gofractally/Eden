#pragma once

#include <clarion/message.hpp>
#include <map>

namespace clarion
{
   template <typename Hash>
   struct message_storage
   {
      using hash_type = decltype(std::declval<Hash>()("", 0));
      hash_type add(const signed_message& m)
      {
         // FIXME: serialization
         auto hash = Hash()(m.data.body.data(), m.data.body.size());
         auto [pos, inserted] = data.insert({hash, m});
         return hash;
      }
      const signed_message* get(const hash_type& key) const
      {
         auto pos = data.find(key);
         if (pos != data.end())
         {
            return &pos->second;
         }
         else
         {
            return nullptr;
         }
      }
      std::map<hash_type, signed_message> data;
   };
}  // namespace clarion
