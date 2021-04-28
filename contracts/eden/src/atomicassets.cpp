#include <atomicassets-interface.hpp>
#include <atomicdata.hpp>
#include <constants.hpp>
#include <eden-atomicassets.hpp>

namespace atomicassets
{
   EOSIO_REFLECT(FORMAT, name, type);
   EOSIO_REFLECT(collections_s,
                 collection_name,
                 author,
                 allow_notify,
                 authorized_accounts,
                 notify_accounts,
                 market_fee,
                 serialized_data)
   EOSIO_REFLECT(schemas_s, schema_name, format);
   EOSIO_REFLECT(templates_s,
                 template_id,
                 schema_name,
                 transferable,
                 burnable,
                 max_supply,
                 issued_supply,
                 immutable_serialized_data);
   EOSIO_REFLECT(assets_s,
                 asset_id,
                 collection_name,
                 schema_name,
                 template_id,
                 ram_payer,
                 backed_tokens,
                 immutable_serialized_data,
                 mutable_serialized_data);
}  // namespace atomicassets

namespace eden::atomicassets
{
   attribute_map read_immutable_data(eosio::name contract,
                                     eosio::name collection,
                                     int32_t template_id)
   {
      ::atomicassets::templates_t templates(contract, collection.value);
      const auto& templ = templates.get(template_id);
      ::atomicassets::schemas_t schemas(contract, collection.value);
      const auto& schema = schemas.get(templ.schema_name.value);
      // Why does atomicassets-interface.hpp use a different FORMAT from atomicdata.hpp?
      std::vector<atomicdata::FORMAT> format;
      for (const auto& [name, type] : schema.format)
      {
         format.push_back({name, type});
      }
      auto attrs = atomicdata::deserialize(templ.immutable_serialized_data, format);
      attribute_map result;
      for (const auto& [key, value] : attrs)
      {
         result.push_back({key, std::get<std::string>(value)});
      }
      return result;
   }

   void init_collection(eosio::name contract,
                        eosio::name self,
                        eosio::name collection,
                        eosio::name schema_name,
                        double market_fee)
   {
      ::atomicassets::collections_t collections(contract, contract.value);
      if (auto pos = collections.find(collection.value); pos != collections.end())
      {
         eosio::check(pos->allow_notify, "Notifications are required");
         eosio::check(std::find(pos->authorized_accounts.begin(), pos->authorized_accounts.end(),
                                self) != pos->authorized_accounts.end(),
                      "Contract is not authorized for the collection");
         if (std::find(pos->notify_accounts.begin(), pos->notify_accounts.end(), self) ==
             pos->notify_accounts.end())
         {
            // This will fail if the contract is not the author of the collection.
            // In that case, it's the responsibility of the author to make sure
            // that notifications are set up.
            actions::addnotifyacc(contract, {self, "active"_n}).send(collection, self);
         }
      }
      else
      {
         actions::createcol(contract, {self, "active"_n})
             .send(self, collection, true, std::vector{self}, std::vector{self}, market_fee,
                   atomicassets::attribute_map{});
      }

      std::vector<format> schema{{"account", "string"}, {"name", "string"},
                                 {"img", "string"},     {"bio", "string"},
                                 {"social", "string"},  {"video", "string"}};
      ::atomicassets::schemas_t schemas(contract, collection.value);
      if (auto pos = schemas.find(schema_name.value); pos != schemas.end())
      {
         auto current_format = pos->format;
         auto comp = [](const auto& lhs, const auto& rhs) {
            if (lhs.name < rhs.name)
               return true;
            else if (lhs.name == rhs.name && lhs.type < rhs.type)
               return true;
            else
               return false;
         };
         std::sort(current_format.begin(), current_format.end(), comp);
         schema.erase(std::remove_if(schema.begin(), schema.end(),
                                     [&](const auto& format) {
                                        return std::binary_search(current_format.begin(),
                                                                  current_format.end(), format,
                                                                  comp);
                                     }),
                      schema.end());
         if (!schema.empty())
         {
            actions::extendschema(contract, {self, "active"_n})
                .send(self, collection, schema_name, schema);
         }
      }
      else
      {
         actions::createschema(contract, {self, "active"_n})
             .send(self, collection, schema_name, schema);
      }
   }
}  // namespace eden::atomicassets
