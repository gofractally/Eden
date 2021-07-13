#pragma once

#include <eosio/bytes.hpp>
#include <eosio/crypto.hpp>
#include <eosio/multi_index.hpp>
#include <utils.hpp>
#include <variant>
#include <vector>

namespace eden
{
   struct encrypted_key
   {
      eosio::public_key sender_key;
      eosio::public_key recipient_key;
      eosio::bytes key;
   };
   EOSIO_REFLECT(encrypted_key, sender_key, recipient_key, key)

   struct encrypted_data_v0
   {
      uint64_t id;
      std::vector<encrypted_key> keys;
      eosio::bytes data;
      uint64_t primary_key() const { return id; }
   };
   EOSIO_REFLECT(encrypted_data_v0, id, keys, data)

   using encrypted_data_variant = std::variant<encrypted_data_v0>;
   struct encrypted_data
   {
      encrypted_data_variant value;
      EDEN_FORWARD_MEMBERS(value, id, keys, data)
      EDEN_FORWARD_FUNCTIONS(value, primary_key)
   };
   EOSIO_REFLECT(encrypted_data, value)

   using encrypted_data_table_type = eosio::multi_index<"encrypted"_n, encrypted_data>;

   struct encrypt
   {
     private:
      eosio::name contract;
      encrypted_data_table_type encrypted_data_tb;

     public:
      encrypt(eosio::name contract, eosio::name scope);
      void set(uint64_t id, const std::vector<encrypted_key>& keys, const eosio::bytes& data);
      void erase(uint64_t id);
      void clear_all();
   };

   // members table: add encryption_key
   //
   // two scopes:
   // induction:
   //   - created after initialization
   //   - erased on induction complete or cancelled
   // election:
   //   - created after round setup
   //   - id = round || group index
   //   - erase on group completion
}  // namespace eden
