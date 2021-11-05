#pragma once

#include <eosio/crypto.hpp>
#include <utils.hpp>

namespace eden
{
   struct session
   {
      eosio::public_key key;
      eosio::block_timestamp expiration;
      std::vector<eosio::varuint32> sequences;
   };
   EOSIO_REFLECT(session, key, expiration, sequences)

   struct session_container_v0
   {
      eosio::name owner;
      eosio::block_timestamp earliest_expiration;
      std::vector<session> sessions;

      uint64_t primary_key() const { return owner.value; }
      uint64_t by_expiration() const { return earliest_expiration.slot; }
   };
   EOSIO_REFLECT(session_container_v0, owner, earliest_expiration, sessions)

   using session_container_variant = std::variant<session_container_v0>;

   struct session_container
   {
      session_container_variant value;
      EDEN_FORWARD_MEMBERS(value, owner, earliest_expiration, sessions);
      EDEN_FORWARD_FUNCTIONS(value, primary_key, by_expiration)
   };
   EOSIO_REFLECT(session_container, value)

   using sessions_table_type = eosio::multi_index<
       "sessions"_n,
       session_container,
       eosio::indexed_by<
           "byexpiration"_n,
           eosio::const_mem_fun<session_container, uint64_t, &session_container::by_expiration>>>;

   struct auth_info
   {
      eosio::name authorized_eden_account;
      void require_auth(eosio::name eden_account) const
      {
         if (eden_account != authorized_eden_account)
            eosio::require_auth(eden_account);
      }
   };
}  // namespace eden
