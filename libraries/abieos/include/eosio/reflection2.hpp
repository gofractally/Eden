#include <eosio/member_proxy.hpp>
#include <eosio/reflection.hpp>

#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/control/iif.hpp>
#include <boost/preprocessor/facilities/check_empty.hpp>
#include <boost/preprocessor/logical/bitand.hpp>
#include <boost/preprocessor/logical/compl.hpp>
#include <boost/preprocessor/seq/for_each_i.hpp>
#include <boost/preprocessor/stringize.hpp>
#include <boost/preprocessor/tuple/push_front.hpp>
#include <boost/preprocessor/variadic/to_seq.hpp>

#define EOSIO_REFLECT2_MATCH_CHECK_N(x, n, r, ...) \
   BOOST_PP_BITAND(n, BOOST_PP_COMPL(BOOST_PP_CHECK_EMPTY(r)))
#define EOSIO_REFLECT2_MATCH_CHECK(...) EOSIO_REFLECT2_MATCH_CHECK_N(__VA_ARGS__, 0, )
#define EOSIO_REFLECT2_MATCH(base, x) EOSIO_REFLECT2_MATCH_CHECK(BOOST_PP_CAT(base, x))

#define EOSIO_REFLECT2_FIRST(a, ...) a
#define EOSIO_REFLECT2_APPLY_FIRST(a) EOSIO_REFLECT2_FIRST(a)
#define EOSIO_REFLECT2_FLATTEN(...) (__VA_ARGS__)

#define EOSIO_REFLECT2_MATCH_ITEM_IMPL(r, STRUCT, i, item, MATCHED_ITEM, UNMATCHED_ITEM)          \
   BOOST_PP_IIF(BOOST_PP_CHECK_EMPTY(item), ,                                                     \
                BOOST_PP_IIF(EOSIO_REFLECT2_MATCH(EOSIO_REFLECT2_MATCH_ITEM, item), MATCHED_ITEM, \
                             UNMATCHED_ITEM)(STRUCT, i, item))

#define EOSIO_REFLECT2_MATCHED_ITEM(STRUCT, i, item)                                       \
   BOOST_PP_CAT(EOSIO_REFLECT2_,                                                           \
                EOSIO_REFLECT2_APPLY_FIRST(BOOST_PP_CAT(EOSIO_REFLECT2_MATCH_ITEM, item))) \
   EOSIO_REFLECT2_FLATTEN(i, STRUCT, BOOST_PP_CAT(EOSIO_REFLECT2_ARGS, item))
#define EOSIO_REFLECT2_UNMATCHED_ITEM(STRUCT, i, member)                    \
   f(#member, [](auto p) -> decltype(&std::decay_t<decltype(*p)>::member) { \
      return &std::decay_t<decltype(*p)>::member;                           \
   });
#define EOSIO_REFLECT2_MATCH_ITEM(r, STRUCT, i, item)                              \
   EOSIO_REFLECT2_MATCH_ITEM_IMPL(r, STRUCT, i, item, EOSIO_REFLECT2_MATCHED_ITEM, \
                                  EOSIO_REFLECT2_UNMATCHED_ITEM)

#define EOSIO_REFLECT2_MATCHED_PROXY(STRUCT, i, item)                                      \
   BOOST_PP_CAT(EOSIO_REFLECT2_PROXY_,                                                     \
                EOSIO_REFLECT2_APPLY_FIRST(BOOST_PP_CAT(EOSIO_REFLECT2_MATCH_ITEM, item))) \
   EOSIO_REFLECT2_FLATTEN(i, STRUCT, BOOST_PP_CAT(EOSIO_REFLECT2_ARGS, item))
#define EOSIO_REFLECT2_PROXY(STRUCT, i, member)                               \
   std::remove_reference_t<decltype(                                          \
       std::declval<eosio::member_proxy<i, &STRUCT::member, ObjectProxy>>())> \
       member;
#define EOSIO_REFLECT2_MATCH_PROXY(r, STRUCT, i, item)                              \
   EOSIO_REFLECT2_MATCH_ITEM_IMPL(r, STRUCT, i, item, EOSIO_REFLECT2_MATCHED_PROXY, \
                                  EOSIO_REFLECT2_PROXY)

#define EOSIO_REFLECT2_MATCH_ITEMbase(...) base, 1
#define EOSIO_REFLECT2_ARGSbase(...) __VA_ARGS__
#define EOSIO_REFLECT2_base(i, STRUCT, base)                                                      \
   static_assert(std::is_base_of_v<base, STRUCT>,                                                 \
                 BOOST_PP_STRINGIZE(base) " is not a base class of " BOOST_PP_STRINGIZE(STRUCT)); \
   eosio_for_each_field((base*)nullptr, f);
#define EOSIO_REFLECT2_PROXY_base(i, STRUCT, BASE)                       \
   std::remove_reference_t<decltype(                                     \
       std::declval<eosio::base_proxy<i, STRUCT, BASE, ObjectProxy>>())> \
       base;

#define EOSIO_REFLECT2_MATCH_ITEMmethod(...) method, 1
#define EOSIO_REFLECT2_ARGSmethod(...) __VA_ARGS__
#define EOSIO_REFLECT2_method(i, STRUCT, member, ...)                \
   f(                                                                \
       BOOST_PP_STRINGIZE(member),                                   \
       [](auto p) -> decltype(&std::decay_t<decltype(*p)>::member) { \
          return &std::decay_t<decltype(*p)>::member;                \
       },                                                            \
       __VA_ARGS__);
#define EOSIO_REFLECT2_PROXY_method(i, STRUCT, member, ...) EOSIO_REFLECT2_PROXY(STRUCT, i, member)

/**
 * EOSIO_REFLECT2(<struct>, <member or base spec>...)
 * Each parameter may be one of the following:
 *    * ident:                         non-static data member or method
 *    * base(ident):                   base class
 *    * method(ident, "arg1", ...):    method
 */
#define EOSIO_REFLECT2(STRUCT, ...)                                               \
   [[maybe_unused]] inline const char* get_type_name(STRUCT*) { return #STRUCT; } \
   template <typename F>                                                          \
   constexpr void eosio_for_each_field(STRUCT*, F f)                              \
   {                                                                              \
      BOOST_PP_SEQ_FOR_EACH_I(EOSIO_REFLECT2_MATCH_ITEM, STRUCT,                  \
                              BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))              \
   }                                                                              \
   template <typename T, typename ObjectProxy>                                    \
   struct eosio_proxy;                                                            \
   template <typename ObjectProxy>                                                \
   struct eosio_proxy<STRUCT, ObjectProxy>                                        \
   {                                                                              \
      ObjectProxy object_proxy;                                                   \
      BOOST_PP_SEQ_FOR_EACH_I(EOSIO_REFLECT2_MATCH_PROXY,                         \
                              STRUCT,                                             \
                              BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))              \
   };                                                                             \
   template <typename ObjectProxy>                                                \
   eosio_proxy<STRUCT, ObjectProxy> eosio_get_proxy_type(const STRUCT*, const ObjectProxy*);

#define EOSIO_REFLECT2_FOR_EACH_FIELD(STRUCT, ...) \
   BOOST_PP_SEQ_FOR_EACH_I(EOSIO_REFLECT2_MATCH_ITEM, STRUCT, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))
