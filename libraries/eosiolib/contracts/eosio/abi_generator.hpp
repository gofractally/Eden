#pragma once
#include <eosio/dispatcher.hpp>

#ifdef COMPILING_ABIGEN
#include <eosio/abi.hpp>

#define EOSIO_MATCH_ACTIONS(x) EOSIO_MATCH(EOSIO_MATCH_ACTIONS, x)
#define EOSIO_MATCH_ACTIONSactions EOSIO_MATCH_YES
#define EOSIO_EXTRACT_ACTIONS_NS(x) BOOST_PP_CAT(EOSIO_EXTRACT_ACTIONS_NS, x)
#define EOSIO_EXTRACT_ACTIONS_NSactions(ns) ns

#define EOSIO_FOOO1(actions)                           \
   EOSIO_EXTRACT_ACTIONS_NS(actions)::for_each_action( \
       [&](auto name, auto fn, auto... member_names) { \
          eosio::print(name, "\n");                    \
          for (auto m : {member_names...})             \
             eosio::print("    ", m, "\n");            \
       });
#define EOSIO_FOOO(r, data, actions) \
   BOOST_PP_IIF(EOSIO_MATCH_ACTIONS(actions), EOSIO_FOOO1, EOSIO_EMPTY)(actions)

#define EOSIO_ABIGEN(...)                                                         \
   int main()                                                                     \
   {                                                                              \
      eosio::abi_def def;                                                         \
      def.version = "eosio::abi/1.1";                                             \
      BOOST_PP_SEQ_FOR_EACH(EOSIO_FOOO, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
      eosio::print(eosio::format_json(def), "\n");                                \
   }
#else  // !COMPILING_ABIGEN
#define EOSIO_ABIGEN(...)
#endif
