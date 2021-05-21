#pragma once

#include <eosio/asset.hpp>
#include <eosio/check.hpp>
#include <eosio/contract.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection.hpp>
#include <string>
#include <vector>

namespace eden::atomicassets
{
   template <typename... T>
   using attribute_variant = std::variant<T..., std::vector<T>...>;
   using attribute_value = attribute_variant<int8_t,
                                             int16_t,
                                             int32_t,
                                             int64_t,
                                             uint8_t,
                                             uint16_t,
                                             uint32_t,
                                             uint64_t,
                                             float,
                                             double,
                                             std::string>;

   struct attribute
   {
      std::string key;
      attribute_value value;
   };
   EOSIO_REFLECT(attribute, key, value);

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
      void setcoldata(eosio::name collection_name, const attribute_map& data);
      void extendschema(eosio::name authorized_creator,
                        eosio::name collection_name,
                        eosio::name schema_name,
                        const std::vector<format>& schema_format);
      void createschema(eosio::name authorized_creator,
                        eosio::name collection_name,
                        eosio::name schema_name,
                        const std::vector<format>& schema_format);
      void mintasset(eosio::name authorized_creator,
                     eosio::name collection_name,
                     eosio::name schema_name,
                     int32_t template_id,
                     eosio::name new_asset_owner,
                     const attribute_map& immutable_data,
                     const attribute_map& mutable_data,
                     const std::vector<eosio::asset>& tokens_to_back);
      void addnotifyacc(eosio::name collection_name, eosio::name account_to_add);
   };
   EOSIO_ACTIONS(atomicassets_contract,
                 "atomicassets"_n,
                 init,
                 createcol,
                 setcoldata,
                 createschema,
                 extendschema,
                 mintasset,
                 addnotifyacc);

   attribute_map read_immutable_data(eosio::name contract,
                                     eosio::name collection,
                                     int32_t template_id);

   void init_collection(eosio::name contract,
                        eosio::name self,
                        eosio::name collection,
                        eosio::name schema,
                        double market_fee,
                        const attribute_map& attrs);

   bool is_locked(eosio::name contract, eosio::name collection, int32_t template_id);

   // Used for testing
   std::vector<int32_t> assets_by_owner(eosio::name contract, eosio::name owner);

   void validate_ipfs(const std::string& cid);
}  // namespace eden::atomicassets
