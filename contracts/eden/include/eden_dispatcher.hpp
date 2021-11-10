#pragma once

#include <eosio/dispatcher.hpp>
#include <sessions.hpp>

namespace eden
{
   template <typename T, typename R, typename... Args>
   void execute_session_action(
       eosio::name contract,
       R (T::*func)(const eosio::excluded_arg<session_info>& current_session, Args...),
       const eosio::excluded_arg<session_info>& current_session,
       eosio::datastream<const char*>& ds)
   {
      std::tuple<std::remove_cvref_t<Args>...> t;
      ds >> t;
      T inst(contract, contract, ds);
      std::apply([&](auto&... args) { (inst.*func)(current_session, std::move(args)...); }, t);
   }
}  // namespace eden

#define EOSIO_MATCH_ACTIONeden_session_action EOSIO_MATCH_YES
#define EOSIO_EXTRACT_ACTION_NAMEeden_session_action(name, index, ...) name
#define EOSIO_EXTRACT_ACTION_ARGSeden_session_action(name, index, ...) __VA_ARGS__

#define EDEN_MATCH_SESSION_ACTION(x) EOSIO_MATCH(EDEN_MATCH_SESSION_ACTION, x)
#define EDEN_MATCH_SESSION_ACTIONeden_session_action EOSIO_MATCH_YES

#define EDEN_EXTRACT_SESSION_ACTION_INDEX(x) BOOST_PP_CAT(EDEN_EXTRACT_SESSION_ACTION_INDEX, x)
#define EDEN_EXTRACT_SESSION_ACTION_INDEXeden_session_action(name, index, ...) index

#define EDEN_DISPATCH_SESSION_ACTION_INTERNAL_1(r, type, member)                         \
   case EDEN_EXTRACT_SESSION_ACTION_INDEX(member):                                       \
      ::eden::execute_session_action(contract, &type::EOSIO_EXTRACT_ACTION_NAME(member), \
                                     current_session, ds);                               \
      return true;
#define EDEN_DISPATCH_SESSION_ACTION_INTERNAL(r, type, member)                              \
   BOOST_PP_IIF(EDEN_MATCH_SESSION_ACTION(member), EDEN_DISPATCH_SESSION_ACTION_INTERNAL_1, \
                EOSIO_EMPTY)                                                                \
   (r, type, member)
#define EDEN_DISPATCH_SESSION_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EDEN_DISPATCH_SESSION_ACTION_INTERNAL, type, MEMBERS)

#define EDEN_GET_SESSION_ACTION_INTERNAL_1(r, type, member) \
   f(EDEN_EXTRACT_SESSION_ACTION_INDEX(member),             \
     BOOST_PP_STRINGIZE(EOSIO_EXTRACT_ACTION_NAME(member)), \
     &type::EOSIO_EXTRACT_ACTION_NAME(member));
#define EDEN_GET_SESSION_ACTION_INTERNAL(r, type, member)                              \
   BOOST_PP_IIF(EDEN_MATCH_SESSION_ACTION(member), EDEN_GET_SESSION_ACTION_INTERNAL_1, \
                EOSIO_EMPTY)                                                           \
   (r, type, member)
#define EDEN_GET_SESSION_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EDEN_GET_SESSION_ACTION_INTERNAL, type, MEMBERS)

#define EDEN_NAME_FOR_SESSION_ACTION_INTERNAL_1(r, type, member) \
   case EDEN_EXTRACT_SESSION_ACTION_INDEX(member):               \
      return BOOST_PP_CAT(BOOST_PP_STRINGIZE(EOSIO_EXTRACT_ACTION_NAME(member)), _n);
#define EDEN_NAME_FOR_SESSION_ACTION_INTERNAL(r, type, member)                              \
   BOOST_PP_IIF(EDEN_MATCH_SESSION_ACTION(member), EDEN_NAME_FOR_SESSION_ACTION_INTERNAL_1, \
                EOSIO_EMPTY)                                                                \
   (r, type, member)
#define EDEN_NAME_FOR_SESSION_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EDEN_NAME_FOR_SESSION_ACTION_INTERNAL, type, MEMBERS)

#define EDEN_INDEX_FOR_SESSION_ACTION_INTERNAL_1(r, type, member)                       \
   if (name == BOOST_PP_CAT(BOOST_PP_STRINGIZE(EOSIO_EXTRACT_ACTION_NAME(member)), _n)) \
      return EDEN_EXTRACT_SESSION_ACTION_INDEX(member);
#define EDEN_INDEX_FOR_SESSION_ACTION_INTERNAL(r, type, member)                              \
   BOOST_PP_IIF(EDEN_MATCH_SESSION_ACTION(member), EDEN_INDEX_FOR_SESSION_ACTION_INTERNAL_1, \
                EOSIO_EMPTY)                                                                 \
   (r, type, member)
#define EDEN_INDEX_FOR_SESSION_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EDEN_INDEX_FOR_SESSION_ACTION_INTERNAL, type, MEMBERS)

#define EDEN_ACTIONS(CONTRACT_CLASS, CONTRACT_ACCOUNT, ...)                                     \
   EOSIO_ACTIONS(CONTRACT_CLASS, CONTRACT_ACCOUNT, __VA_ARGS__)                                 \
   namespace actions                                                                            \
   {                                                                                            \
      inline bool session_dispatch(eosio::name contract,                                        \
                                   uint32_t index,                                              \
                                   const eosio::excluded_arg<session_info>& current_session,    \
                                   eosio::datastream<const char*>& ds)                          \
      {                                                                                         \
         switch (index)                                                                         \
         {                                                                                      \
            EDEN_DISPATCH_SESSION_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
         }                                                                                      \
         return false;                                                                          \
      }                                                                                         \
      template <typename F>                                                                     \
      void for_each_session_action(F f)                                                         \
      {                                                                                         \
         EDEN_GET_SESSION_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))         \
      }                                                                                         \
      inline eosio::name get_name_for_session_action(uint32_t index)                            \
      {                                                                                         \
         switch (index)                                                                         \
         {                                                                                      \
            EDEN_NAME_FOR_SESSION_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
         }                                                                                      \
         return {};                                                                             \
      }                                                                                         \
      inline std::optional<uint32_t> get_index_for_session_action(eosio::name name)             \
      {                                                                                         \
         EDEN_INDEX_FOR_SESSION_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))   \
         return {};                                                                             \
      }                                                                                         \
   }
