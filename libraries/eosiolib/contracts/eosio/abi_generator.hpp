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
      std::map<std::type_index, std::string> type_to_name;
      std::set<std::string> used_type_names;
      std::map<std::string, type_def> type_defs{};
      std::map<std::string, struct_def> structs{};
      std::map<name, action_def> actions{};
      std::map<std::string, table_def> tables{};
      std::map<std::string, variant_def> variants{};

      eosio::abi_def get_def() &&
      {
         eosio::abi_def result;
         result.version = "eosio::abi/1.1";
         for (auto& t : type_defs)
            result.types.push_back(std::move(t.second));
         for (auto& t : structs)
            result.structs.push_back(std::move(t.second));
         for (auto& t : actions)
            result.actions.push_back(std::move(t.second));
         for (auto& t : tables)
            result.tables.push_back(std::move(t.second));
         for (auto& t : variants)
            result.variants.value.push_back(std::move(t.second));
         return result;
      }

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
               type_defs[name] = {name, get_type<inner>(true)};
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
               type_defs[name] = {name, get_type<inner>(true)};
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

            internal_use_do_not_use::eosio_assert(
                false,
                ("don't know how to generate abi for " + std::string{typeid(T).name()}).c_str());
         }
      }  // get_type

      void add_action(auto name, auto wrapper, auto... member_names)
      {
         const auto& struct_name = reserve_name(name.to_string());
         auto& act = actions[name];
         act.name = name;
         act.type = struct_name;
         auto& def = structs[struct_name];
         def.name = struct_name;
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
      eosio::print(eosio::format_json(std::move(gen).get_def()), "\n");                    \
   }
