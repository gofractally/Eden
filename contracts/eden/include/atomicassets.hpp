#include <eosio/reflection.hpp>
#include <eosio/check.hpp>
#include <vector>
#include <string>

namespace atomicassets {

   struct attribute {
      std::string key;
      std::string value;
      uint8_t type = 10; // The value is actually a variant, but we're only using string
   };
   EOSIO_REFLECT(attribute, key, type, value);

   template<typename S>
   void from_bin(attribute& attr, S& stream)
   {
      from_bin(attr.key, stream);
      from_bin(attr.type, stream);
      eosio::check(attr.type == 10, "Unexpected attribute type");
      from_bin(attr.value, stream);
   }

   using attribute_map = std::vector<attribute>;
}
