#include <encrypt.hpp>

namespace eden
{
   encrypt::encrypt(eosio::name contract, eosio::name scope)
       : contract(contract), encrypted_data_tb{contract, scope.value}
   {
   }

   void encrypt::set(uint64_t id, const std::vector<encrypted_key>& keys, const eosio::bytes& data)
   {
      encrypted_data_tb.emplace(contract, [&](auto& row) {
         row.value = encrypted_data_v0{id, keys, data};
      });
   }

   void encrypt::erase(uint64_t id)
   {
      auto iter = encrypted_data_tb.find(id);
      if (iter != encrypted_data_tb.end())
      {
         encrypted_data_tb.erase(iter);
      }
   }
}  // namespace eden
