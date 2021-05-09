#pragma once
#include <eosio/abi.hpp>
#include <eosio/dispatcher.hpp>
#include <map>
#include <optional>
#include <type_traits>
#include <typeindex>
#include <variant>
#include <vector>

namespace eosio
{
   template <typename T>
   struct is_vector : std::false_type
   {
   };

   template <typename T>
   struct is_vector<std::vector<T>> : std::true_type
   {
      using type = T;
   };

   template <typename T>
   struct is_optional : std::false_type
   {
   };

   template <typename T>
   struct is_optional<std::optional<T>> : std::true_type
   {
      using type = T;
   };

   template <typename T>
   struct is_variant : std::false_type
   {
   };

   template <typename T>
   struct is_variant<std::variant<T>> : std::true_type
   {
      using type = T;
   };

   struct abi_generator
   {
      eosio::abi_def def{"eosio::abi/1.1"};
      std::map<std::type_index, std::string> type_to_name;
      std::set<std::string> used_type_names;

      void add_builtin_types()
      {
         for_each_abi_type([&](auto p) {
            type_to_name[typeid(decltype(*p))] = get_type_name(p);
            used_type_names.insert(get_type_name(p));
         });
      }

      const std::string& reserve_name(const std::string& base)
      {
         if (auto [it, inserted] = used_type_names.insert(base); inserted)
            return *it;
         for (uint32_t i = 0;; ++i)
            if (auto [it, inserted] = used_type_names.insert(base + std::to_string(i)); inserted)
               return *it;
      }

      template <typename Raw>
      std::string get_type(bool force_alias = false)
      {
         using T = std::decay_t<Raw>;
         if constexpr (is_vector<T>())
         {
            using inner = std::decay_t<typename is_vector<T>::type>;
            if (force_alias || is_vector<inner>() || is_optional<inner>())
            {
               std::type_index type = typeid(T);
               auto it = type_to_name.find(type);
               if (it != type_to_name.end())
                  return it->second;
               const auto& name = reserve_name("vector<" + get_type<inner>() + ">");
               def.types.push_back({name, get_type<inner>(true)});
               return name;
            }
            return get_type<inner>() + "[]";
         }
         else if constexpr (is_optional<T>())
         {
            using inner = std::decay_t<typename is_optional<T>::type>;
            if (force_alias || is_vector<inner>() || is_optional<inner>())
            {
               std::type_index type = typeid(T);
               auto it = type_to_name.find(type);
               if (it != type_to_name.end())
                  return it->second;
               const auto& name = reserve_name("optional<" + get_type<inner>() + ">");
               def.types.push_back({name, get_type<inner>(true)});
               return name;
            }
            return get_type<inner>() + "?";
         }
         else
         {
            std::type_index type = typeid(T);
            auto it = type_to_name.find(type);
            if (it != type_to_name.end())
               return it->second;

            return std::string(std::string("***") + type.name());
            // internal_use_do_not_use::eosio_assert(
            //     false,
            //     ("don't know how to generate abi for " + std::string{typeid(T).name()}).c_str());
         }
      }  // get_type

      void add_action(auto name, auto wrapper, auto... member_names)
      {
         const auto& struct_name = reserve_name(name.to_string());
         def.actions.push_back({name, struct_name});
         def.structs.push_back({struct_name});
         auto& def = this->def.structs.back();
         add_action_args<0>(def, (typename decltype(wrapper)::args*)nullptr, member_names...);
      }

      template <uint32_t i, typename T, typename... Ts, typename N, typename... Ns>
      void add_action_args(struct_def& def, std::tuple<T, Ts...>*, N name, Ns... names)
      {
         def.fields.push_back({name, get_type<T>()});
         add_action_args<i + 1>(def, (std::tuple<Ts...>*)nullptr, names...);
      }

      template <uint32_t i, typename T, typename... Ts>
      void add_action_args(struct_def& def, std::tuple<T, Ts...>*)
      {
         def.fields.push_back({"arg" + std::to_string(i), get_type<T>()});
         add_action_args<i + 1>(def, (std::tuple<Ts...>*)nullptr);
      }

      template <uint32_t i, typename... Ns>
      void add_action_args(struct_def& def, std::tuple<>*, Ns... names)
      {
      }
   };  // abi_generator
}  // namespace eosio

#define EOSIO_ABIGEN_MATCH_ACTIONS(x) EOSIO_MATCH(EOSIO_ABIGEN_MATCH_ACTIONS, x)
#define EOSIO_ABIGEN_MATCH_ACTIONSactions EOSIO_MATCH_YES
#define EOSIO_ABIGEN_EXTRACT_ACTIONS_NS(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_ACTIONS_NS, x)
#define EOSIO_ABIGEN_EXTRACT_ACTIONS_NSactions(ns) ns

#define EOSIO_ABIGEN_ACTION1(actions)                         \
   EOSIO_ABIGEN_EXTRACT_ACTIONS_NS(actions)::for_each_action( \
       [&](auto name, auto fn, auto... member_names) {        \
          gen.add_action(name, fn, member_names...);          \
       });
#define EOSIO_ABIGEN_ACTION(r, data, actions) \
   BOOST_PP_IIF(EOSIO_ABIGEN_MATCH_ACTIONS(actions), EOSIO_ABIGEN_ACTION1, EOSIO_EMPTY)(actions)

#define EOSIO_ABIGEN(...)                                                                  \
   int main()                                                                              \
   {                                                                                       \
      eosio::abi_generator gen;                                                            \
      gen.add_builtin_types();                                                             \
      BOOST_PP_SEQ_FOR_EACH(EOSIO_ABIGEN_ACTION, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
      eosio::print(eosio::format_json(gen.def), "\n");                                     \
   }
