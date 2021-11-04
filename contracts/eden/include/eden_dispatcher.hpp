#pragma once

#include <contract_auth.hpp>
#include <eosio/dispatcher.hpp>

namespace eden
{
   template <typename T, typename R, typename... Args>
   void execute_auth_action(eosio::name contract,
                            R (T::*func)(const eosio::excluded_arg<auth_info>& auth, Args...),
                            const eosio::excluded_arg<auth_info>& auth,
                            eosio::datastream<const char*>& ds)
   {
      std::tuple<std::remove_cvref_t<Args>...> t;
      ds >> t;
      T inst(contract, contract, ds);
      std::apply([&](auto&... args) { (inst.*func)(auth, std::move(args)...); }, t);
   }
}  // namespace eden

#define EOSIO_MATCH_ACTIONeden_auth_action EOSIO_MATCH_YES
#define EOSIO_EXTRACT_ACTION_NAMEeden_auth_action(name, index, ...) name
#define EOSIO_EXTRACT_ACTION_ARGSeden_auth_action(name, index, ...) __VA_ARGS__

#define EDEN_MATCH_AUTH_ACTION(x) EOSIO_MATCH(EDEN_MATCH_AUTH_ACTION, x)
#define EDEN_MATCH_AUTH_ACTIONeden_auth_action EOSIO_MATCH_YES

#define EDEN_EXTRACT_AUTH_ACTION_INDEX(x) BOOST_PP_CAT(EDEN_EXTRACT_AUTH_ACTION_INDEX, x)
#define EDEN_EXTRACT_AUTH_ACTION_INDEXeden_auth_action(name, index, ...) index

#define EDEN_DISPATCH_AUTH_ACTION_INTERNAL_1(r, type, member)                                    \
   case EDEN_EXTRACT_AUTH_ACTION_INDEX(member):                                                  \
      ::eden::execute_auth_action(contract, &type::EOSIO_EXTRACT_ACTION_NAME(member), auth, ds); \
      return true;
#define EDEN_DISPATCH_AUTH_ACTION_INTERNAL(r, type, member)                                        \
   BOOST_PP_IIF(EDEN_MATCH_AUTH_ACTION(member), EDEN_DISPATCH_AUTH_ACTION_INTERNAL_1, EOSIO_EMPTY) \
   (r, type, member)
#define EDEN_DISPATCH_AUTH_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EDEN_DISPATCH_AUTH_ACTION_INTERNAL, type, MEMBERS)

#define EDEN_ACTIONS(CONTRACT_CLASS, CONTRACT_ACCOUNT, ...)                                  \
   EOSIO_ACTIONS(CONTRACT_CLASS, CONTRACT_ACCOUNT, __VA_ARGS__)                              \
   namespace actions                                                                         \
   {                                                                                         \
      inline bool dispatch_auth(eosio::name contract,                                        \
                                uint32_t index,                                              \
                                const eosio::excluded_arg<auth_info>& auth,                  \
                                eosio::datastream<const char*>& ds)                          \
      {                                                                                      \
         switch (index)                                                                      \
         {                                                                                   \
            EDEN_DISPATCH_AUTH_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
         }                                                                                   \
         return false;                                                                       \
      }                                                                                      \
   }
