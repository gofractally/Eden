#pragma once

#include <eosio/check.hpp>
#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection.hpp>
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

   struct format
   {
      std::string name;
      std::string type;
   };
   EOSIO_REFLECT(format, name, type);

   struct atomicassets_contract : eosio::contract
   {
      using contract::contract;
      void init();
      void createcol(eosio::name author,
                     eosio::name collection_name,
                     bool allow_notify,
                     const std::vector<eosio::name>& authorized_accounts,
                     const std::vector<eosio::name>& notify_accounts,
                     double market_fee,
                     const attribute_map& data);
      void createschema(eosio::name authorized_creator,
                        eosio::name collection_name,
                        eosio::name schema_name,
                        const std::vector<format>& schema_format);
   };
   EOSIO_ACTIONS(atomicassets_contract, "atomicassets"_n, init, createcol, createschema);

   attribute_map read_immutable_data(eosio::name contract,
                                     eosio::name collection,
                                     int32_t template_id);
}  // namespace eden::atomicassets
