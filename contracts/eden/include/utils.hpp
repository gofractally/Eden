#pragma once

#include <eosio/eosio.hpp>
#include <eosio/system.hpp>

namespace eden
{
   inline static uint128_t combine_names(const eosio::name a, const eosio::name b)
   {
      return uint128_t{a.value} << 64 | b.value;
   }

#define EDEN_FORWARD_FUNCTION(var, fun)                                \
   auto fun() const                                                    \
   {                                                                   \
      return std::visit([](auto& value) { return value.fun(); }, var); \
   }
#define EDEN_FORWARD_FUNCTIONS(var, ...) \
   EOSIO_MAP_REUSE_ARG0(EDEN_FORWARD_FUNCTION, var, __VA_ARGS__)

#define EDEN_FORWARD_MEMBER(var, member)                                                    \
   decltype(auto) member()                                                                  \
   {                                                                                        \
      return std::visit([](auto& value) -> decltype(auto) { return (value.member); }, var); \
   }                                                                                        \
   decltype(auto) member() const                                                            \
   {                                                                                        \
      return std::visit([](auto& value) -> decltype(auto) { return (value.member); }, var); \
   }
#define EDEN_FORWARD_MEMBERS(var, ...) EOSIO_MAP_REUSE_ARG0(EDEN_FORWARD_MEMBER, var, __VA_ARGS__)

}  // namespace eden
