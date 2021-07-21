#include <encrypt.hpp>

namespace eden
{
   encrypt::encrypt(eosio::name contract, eosio::name scope)
       : contract(contract), encrypted_data_tb{contract, scope.value}
   {
   }

   void encrypt::set(uint64_t id,
                     const std::vector<encrypted_key>& keys,
                     const eosio::bytes& data,
                     const std::optional<eosio::bytes>& old_data)
   {
      auto iter = encrypted_data_tb.find(id);
      if (iter == encrypted_data_tb.end())
      {
         eosio::check(!old_data, "Encrypted data not previously set");
         encrypted_data_tb.emplace(contract, [&](auto& row) {
            row.value = encrypted_data_v0{id, keys, data};
         });
      }
      else
      {
         eosio::check(!!old_data && *old_data == iter->data(), "Encrypted data does not match");
         encrypted_data_tb.modify(iter, contract, [&](auto& row) {
            row.keys() = keys;
            row.data() = data;
         });
      }
   }

   void encrypt::erase(uint64_t id)
   {
      auto iter = encrypted_data_tb.find(id);
      if (iter != encrypted_data_tb.end())
      {
         encrypted_data_tb.erase(iter);
      }
   }

   void encrypt::clear_all() { clear_table(encrypted_data_tb); }
}  // namespace eden
