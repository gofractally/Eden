#pragma once

#include <clarion/identity.hpp>
#include <string>
#include <vector>

namespace clarion
{
   struct object_id
   {
      identity owner;
      std::string name;
      friend auto operator<=>(const object_id&, const object_id&) = default;
   };

   std::vector<unsigned char> convert_to_bin(const object_id& id)
   {
      std::vector<unsigned char> result;
      result.insert(result.end(), id.owner.original_keyid.hash.begin(),
                    id.owner.original_keyid.hash.end());
      result.insert(result.end(), id.name.begin(), id.name.end());
      return result;
   }

   inline std::string to_string(const clarion::object_id& id)
   {
      std::string result;
      for (unsigned char byte : id.owner.original_keyid.hash)
      {
         char hex[] = "0123456789ABCDEF";
         result.push_back(hex[byte >> 4]);
         result.push_back(hex[byte & 0xF]);
      }
      result.push_back('/');
      result += id.name;
      return result;
   }

   enum class object_kind : uint32_t
   {
      unknown,
      channel_sha256,
      subscriptions_sha256,
      identity_sha256
   };
}  // namespace clarion
