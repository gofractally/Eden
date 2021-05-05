#pragma once
#include <boost/fusion/adapted/std_tuple.hpp>
#include <boost/fusion/include/std_tuple.hpp>
#include <boost/mp11/tuple.hpp>
#include <boost/preprocessor/cat.hpp>
#include <boost/preprocessor/control/iif.hpp>
#include <boost/preprocessor/facilities/check_empty.hpp>
#include <boost/preprocessor/logical/bitand.hpp>
#include <boost/preprocessor/logical/compl.hpp>
#include <boost/preprocessor/seq/for_each.hpp>
#include <boost/preprocessor/stringize.hpp>
#include <boost/preprocessor/variadic/to_seq.hpp>
#include <eosio/action.hpp>

extern "C"
{
   /**
    * Set the action return value which will be included in the action_receipt
    * @brief Set the action return value
    * @param return_value - serialized return value
    * @param size - size of serialized return value in bytes
    * @pre `return_value` is a valid pointer to an array at least `size` bytes long
    */
   [[clang::import_name("set_action_return_value")]] void set_action_return_value(
       void* return_value,
       size_t size);
}  // extern "C"

namespace eosio
{
   inline constexpr name any_contract;

   /**
    * Unpack the received action and execute the correponding action handler
    *
    * @ingroup dispatcher
    * @tparam T - The contract class that has the correponding action handler, this contract should
    * be derived from eosio::contract
    * @tparam Q - The namespace of the action handler function
    * @tparam Args - The arguments that the action handler accepts, i.e. members of the action
    * @param obj - The contract object that has the correponding action handler
    * @param func - The action handler
    * @return true
    */
   template <typename T, typename R, typename... Args>
   bool execute_action(name self, name code, R (T::*func)(Args...))
   {
      size_t size = action_data_size();

      // using malloc/free here potentially is not exception-safe, although WASM doesn't support
      // exceptions
      void* buffer = nullptr;
      if (size > 0)
      {
         buffer = malloc(size);
         read_action_data(buffer, size);
      }

      std::tuple<std::decay_t<Args>...> args;
      datastream<const char*> ds((char*)buffer, size);
      ds >> args;

      T inst(self, code, ds);

      auto f2 = [&](auto... a) { return ((&inst)->*func)(a...); };

      if constexpr (!std::is_same_v<void, R>)
      {
         auto r = eosio::pack(boost::mp11::tuple_apply(f2, args));
         ::set_action_return_value(r.data(), r.size());
      }
      else
      {
         boost::mp11::tuple_apply(f2, args);
      }

      if (size)
      {
         free(buffer);
      }
      return true;
   }

#define EOSIO_EMPTY(...)

#define EOSIO_MATCH_CHECK_N(x, n, r, ...) \
   BOOST_PP_BITAND(n, BOOST_PP_COMPL(BOOST_PP_CHECK_EMPTY(r)))
#define EOSIO_MATCH_CHECK(...) EOSIO_MATCH_CHECK_N(__VA_ARGS__, 0, )
#define EOSIO_MATCH_YES ~, 1,
#define EOSIO_MATCH(base, x) EOSIO_MATCH_CHECK(BOOST_PP_CAT(base, x))

#define EOSIO_MATCH_NOTIFY(x) EOSIO_MATCH(EOSIO_MATCH_NOTIFY_, x)
#define EOSIO_MATCH_NOTIFY_notify EOSIO_MATCH_YES
#define EOSIO_EXTRACT_NOTIFY_CODE(x) BOOST_PP_CAT(EOSIO_EXTRACT_NOTIFY_CODE_, x)
#define EOSIO_EXTRACT_NOTIFY_CODE_notify(code, action) code
#define EOSIO_EXTRACT_NOTIFY_ACTION(x) BOOST_PP_CAT(EOSIO_EXTRACT_NOTIFY_ACTION_, x)
#define EOSIO_EXTRACT_NOTIFY_ACTION_notify(code, action) action

#define EOSIO_DISPATCH_ACTION_INTERNAL_1(r, type, member)                                        \
   case eosio::hash_name(BOOST_PP_STRINGIZE(member)):                                            \
      executed = eosio::execute_action(eosio::name(receiver), eosio::name(code), &type::member); \
      break;
#define EOSIO_DISPATCH_ACTION_INTERNAL(r, type, member)                                    \
   BOOST_PP_IIF(EOSIO_MATCH_NOTIFY(member), EOSIO_EMPTY, EOSIO_DISPATCH_ACTION_INTERNAL_1) \
   (r, type, member)
#define EOSIO_DISPATCH_ACTION(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EOSIO_DISPATCH_ACTION_INTERNAL, type, MEMBERS)

#define EOSIO_NOTIFY_ACTION_INTERNAL_1(r, type, notification)                                    \
   else if ((EOSIO_EXTRACT_NOTIFY_CODE(notification) == eosio::any_contract ||                   \
             eosio::name{code} == EOSIO_EXTRACT_NOTIFY_CODE(notification)) &&                    \
            action ==                                                                            \
                eosio::hash_name(BOOST_PP_STRINGIZE(EOSIO_EXTRACT_NOTIFY_ACTION(notification)))) \
   {                                                                                             \
      eosio::execute_action(                                                                     \
          eosio::name(receiver), eosio::name(code),                                              \
          &type::BOOST_PP_CAT(notify_, EOSIO_EXTRACT_NOTIFY_ACTION(notification)));              \
   }
#define EOSIO_DISPATCH_NOTIFY_INTERNAL(r, type, notification)                                  \
   BOOST_PP_IIF(EOSIO_MATCH_NOTIFY(notification), EOSIO_NOTIFY_ACTION_INTERNAL_1, EOSIO_EMPTY) \
   (r, type, notification)
#define EOSIO_DISPATCH_NOTIFY(type, MEMBERS) \
   BOOST_PP_SEQ_FOR_EACH(EOSIO_DISPATCH_NOTIFY_INTERNAL, type, MEMBERS)

#define EOSIO_ACTION_WRAPPER_DECL_1(r, data, action)  \
   using action = eosio::action_wrapper<BOOST_PP_CAT( \
       BOOST_PP_STRINGIZE(action), _h), &__contract_class::action, __contract_account>;
#define EOSIO_ACTION_WRAPPER_DECL_0(r, data, action)

#define EOSIO_ACTION_WRAPPER_DECL(r, data, action)                                      \
   BOOST_PP_CAT(EOSIO_ACTION_WRAPPER_DECL_, BOOST_PP_COMPL(EOSIO_MATCH_NOTIFY(action))) \
   (r, data, action)

#define EOSIO_ACTIONS(CONTRACT_CLASS, CONTRACT_ACCOUNT, ...)                                     \
   namespace actions                                                                             \
   {                                                                                             \
      static constexpr auto __contract_account = CONTRACT_ACCOUNT;                               \
      using __contract_class = CONTRACT_CLASS;                                                   \
      BOOST_PP_SEQ_FOR_EACH(EOSIO_ACTION_WRAPPER_DECL, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
                                                                                                 \
      inline void eosio_apply(uint64_t receiver, uint64_t code, uint64_t action)                 \
      {                                                                                          \
         if (code == receiver)                                                                   \
         {                                                                                       \
            bool executed = false;                                                               \
            switch (action)                                                                      \
            {                                                                                    \
               EOSIO_DISPATCH_ACTION(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))      \
            }                                                                                    \
            eosio::check(executed == true, "unknown action");                                    \
         }                                                                                       \
         else                                                                                    \
         {                                                                                       \
            if (false)                                                                           \
            {                                                                                    \
            }                                                                                    \
            EOSIO_DISPATCH_NOTIFY(CONTRACT_CLASS, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__))         \
         }                                                                                       \
      }                                                                                          \
   }

#define EOSIO_ACTION_DISPATCHER(NAMESPACE)                          \
   extern "C"                                                       \
   {                                                                \
      void __wasm_call_ctors();                                     \
      void apply(uint64_t receiver, uint64_t code, uint64_t action) \
      {                                                             \
         __wasm_call_ctors();                                       \
         NAMESPACE ::eosio_apply(receiver, code, action);           \
      }                                                             \
   }

}  // namespace eosio
