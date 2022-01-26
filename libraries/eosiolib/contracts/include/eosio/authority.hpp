#pragma once

#include <eosio/crypto.hpp>
#include <eosio/name.hpp>
#include <eosio/serialize.hpp>

namespace eosio
{
   struct permission_level
   {
      permission_level() {}
      permission_level(name actor, name permission) : actor(actor), permission(permission) {}

      name actor;
      name permission;

      friend constexpr bool operator==(const permission_level& a, const permission_level& b)
      {
         return std::tie(a.actor, a.permission) == std::tie(b.actor, b.permission);
      }

      friend constexpr bool operator<(const permission_level& a, const permission_level& b)
      {
         return std::tie(a.actor, a.permission) < std::tie(b.actor, b.permission);
      }
   };
   EOSIO_REFLECT(permission_level, actor, permission)

   struct permission_level_weight
   {
      permission_level permission;
      uint16_t weight = 0;
   };
   EOSIO_REFLECT(permission_level_weight, permission, weight)

   struct key_weight
   {
      public_key key;
      uint16_t weight = 0;
   };
   EOSIO_REFLECT(key_weight, key, weight)

   struct wait_weight
   {
      uint32_t wait_sec = 0;
      uint16_t weight = 0;
   };
   EOSIO_REFLECT(wait_weight, wait_sec, weight)

   struct authority
   {
      uint32_t threshold = 0;
      std::vector<key_weight> keys;
      std::vector<permission_level_weight> accounts;
      std::vector<wait_weight> waits;
   };
   EOSIO_REFLECT(authority, threshold, keys, accounts, waits)
}  // namespace eosio
