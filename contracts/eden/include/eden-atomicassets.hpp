#pragma once

#include <eosio/check.hpp>
#include <eosio/reflection.hpp>
#include <eosio/name.hpp>
#include <string>
#include <vector>

namespace eden::atomicassets
{
   struct attribute
   {
      std::string key;
      std::string value;
      uint8_t type = 10;  // The value is actually a variant, but we're only using string
   };
   EOSIO_REFLECT(attribute, key, type, value);

   template <typename S>
   void from_bin(attribute& attr, S& stream)
   {
      from_bin(attr.key, stream);
      from_bin(attr.type, stream);
      eosio::check(attr.type == 10, "Unexpected attribute type");
      from_bin(attr.value, stream);
   }

   using attribute_map = std::vector<attribute>;

   attribute_map read_immutable_data(eosio::name contract, eosio::name collection, int32_t template_id);
}  // namespace atomicassets
