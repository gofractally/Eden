#include <atomicassets-interface.hpp>
#include <atomicdata.hpp>
#include <constants.hpp>
#include <eden-atomicassets.hpp>

namespace atomicassets
{
   EOSIO_REFLECT(FORMAT, name, type);
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

}  // namespace eden::atomicassets
