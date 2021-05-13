#pragma once
#include <boost/preprocessor/punctuation/comma_if.hpp>
#include <eosio/abi.hpp>
#include <eosio/dispatcher.hpp>
#include <eosio/types.hpp>
#include <map>
#include <type_traits>
#include <typeindex>

namespace eosio
{
   struct abi_generator
   {
      eosio::abi_def def{"eosio::abi/1.1"};
      std::map<std::type_index, std::string> type_to_name;
      std::map<std::string, std::type_index> name_to_type;

      void add_builtin_types()
      {
         for_each_abi_type([&](auto p) {
            type_to_name.insert({typeid(decltype(*p)), get_type_name(p)});
            name_to_type.insert({get_type_name(p), typeid(decltype(*p))});
         });
      }

      const std::string& reserve_name(const std::string& base, std::type_index type)
      {
         if (auto [it, inserted] = name_to_type.insert({base, type}); inserted)
            return it->first;
         for (uint32_t i = 0;; ++i)
            if (auto [it, inserted] = name_to_type.insert({base + std::to_string(i), type});
                inserted)
               return it->first;
      }

      // TODO: std::pair (needed by map), std::tuple
      template <typename Raw>
      std::string get_type(bool force_alias = false, bool fake_alias = false)
      {
         using T = std::remove_cvref_t<Raw>;
         if constexpr (is_serializable_container<T>())
         {
            using inner = std::remove_cvref_t<typename is_serializable_container<T>::value_type>;
            if (force_alias)
            {
               std::type_index type = typeid(T);
               auto it = type_to_name.find(type);
               if (it != type_to_name.end())
                  return it->second;
               auto inner_name = get_type<inner>(true);
               const auto& name = reserve_name("vector<" + inner_name + ">", type);
               type_to_name[typeid(T)] = name;
               def.types.push_back({name, inner_name + "[]"});
               return name;
            }
            if (fake_alias)
               return "vector<" + get_type<inner>(true) + ">";
            return get_type<inner>(true) + "[]";
         }
         else if constexpr (is_std_optional<T>())
         {
            using inner = std::remove_cvref_t<typename is_std_optional<T>::value_type>;
            if (force_alias)
            {
               std::type_index type = typeid(T);
               auto it = type_to_name.find(type);
               if (it != type_to_name.end())
                  return it->second;
               auto inner_name = get_type<inner>(true);
               const auto& name = reserve_name("optional<" + inner_name + ">", type);
               type_to_name[typeid(T)] = name;
               def.types.push_back({name, inner_name + "?"});
               return name;
            }
            if (fake_alias)
               return "optional<" + get_type<inner>(true) + ">";
            return get_type<inner>(true) + "?";
         }
         else if constexpr (is_binary_extension<T>())
         {
            return get_type<typename is_binary_extension<T>::value_type>() + "$";
         }
         else if constexpr (is_std_variant<T>())
         {
            std::type_index type = typeid(T);
            auto it = type_to_name.find(type);
            if (it != type_to_name.end())
               return it->second;
            auto name = reserve_name(generate_variant_name((T*)nullptr), type);
            type_to_name[typeid(T)] = name;
            variant_def d{name};
            add_variant_types(d, (typename is_std_variant<T>::types*)nullptr);
            def.variants.value.push_back(std::move(d));
            return name;
         }
         else
         {
            std::type_index type = typeid(T);
            auto it = type_to_name.find(type);
            if (it != type_to_name.end())
               return it->second;

            if constexpr (reflection::has_for_each_field_v<T>)
            {
               const auto& name = reserve_name(get_type_name((T*)nullptr), type);
               type_to_name[typeid(T)] = name;
               struct_def d{name};
               for_each_field<T>([&](const char* n, auto&& member) {
                  d.fields.push_back({n, get_type<decltype(member((T*)nullptr))>()});
               });
               def.structs.push_back(std::move(d));
               return name;
            }
            else
            {
               internal_use_do_not_use::eosio_assert(
                   false, ("Don't know how to generate abi for " + std::string{typeid(T).name()} +
                           ". Try EOSIO_REFLECT")
                              .c_str());
            }
         }
      }  // get_type

      template <typename T, typename... Ts>
      std::string generate_variant_name(std::variant<T, Ts...>* p)
      {
         return std::string{"variant<"} +
                (get_type<T>(false, true) + ... + ("," + get_type<Ts>(false, true))) + ">";
      }

      std::string generate_variant_name(std::variant<>*) { return "variant<>"; }

      template <typename Raw, typename... Ts, typename N, typename... Ns>
      void add_variant_types(variant_def& d, type_list<Raw, Ts...>*, N name, Ns... names)
      {
         using T = std::remove_cvref_t<Raw>;
         std::type_index type = typeid(T);
         auto it = name_to_type.find(name);
         if (it != name_to_type.end())
         {
            if (it->second != type)
               check(false,
                     "type \"" + std::string{name} +
                         "\" conflicts with a type with the same name. Try moving it earlier "
                         "within EOSIO_ABIGEN().");
         }
         else
         {
            name_to_type.insert({name, type});
            def.types.push_back({name, get_type<T>()});
         }
         d.types.push_back(name);
         add_variant_types(d, (type_list<Ts...>*)nullptr, names...);
      }

      template <typename T, typename... Ts>
      void add_variant_types(variant_def& d, type_list<T, Ts...>*)
      {
         d.types.push_back(get_type<T>());
         (d.types.push_back(get_type<Ts>()), ...);
      }

      template <typename... Ns>
      void add_variant_types(variant_def& d, type_list<>*, Ns...)
      {
      }

      void add_action(auto name, auto wrapper, const auto& ricardian_contract, auto... arg_names)
      {
         auto check_name = [&](const char* arg) {
            if (auto p = strchr(arg, '('))
               eosio::check(false, "unrecognized directive within action \"" + std::string{name} +
                                       "\": " + arg);
         };
         (check_name(arg_names), ...);

         const auto& struct_name = reserve_name(name.to_string(), typeid(nullptr));
         def.actions.push_back({name, struct_name, ricardian_contract});
         struct_def d{struct_name};
         add_action_args<0>(d, (typename decltype(wrapper)::args*)nullptr, arg_names...);
         def.structs.push_back(std::move(d));
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

      template <uint32_t i, typename N, typename... Ns>
      void add_action_args(struct_def& def, std::tuple<>*, N name, Ns... names)
      {
         eosio::check(false, "unused argument name \"" + std::string{name} + "\" in action \"" +
                                 def.name + "\"");
      }

      template <uint32_t i>
      void add_action_args(struct_def& def, std::tuple<>*)
      {
      }

      template <typename T>
      void add_table(const auto& name)
      {
         def.tables.push_back({
             .name{name},
             .index_type{"i64"},
             .key_names{},
             .key_types{},
             .type{get_type<T>()},
         });
      }

      template <typename T, typename... Ns>
      std::string add_variant(std::string name, Ns... names)
      {
         std::type_index type = typeid(T);
         auto it = type_to_name.find(type);
         if (it != type_to_name.end())
         {
            if (it->second != name)
               check(false, "variant \"" + name + "\" is already defined with name \"" +
                                it->second + "\". Try moving it earlier within EOSIO_ABIGEN().");
         }
         else if (name_to_type.find(name) != name_to_type.end())
         {
            check(false, "variant \"" + name +
                             "\" conflicts with a type with the same name. Try moving it earlier "
                             "within EOSIO_ABIGEN().");
         }
         else
         {
            type_to_name.insert({typeid(T), name});
            name_to_type.insert({name, typeid(T)});
         }
         variant_def d{name};
         add_variant_types(d, (typename is_std_variant<T>::types*)nullptr, names...);
         def.variants.value.push_back(std::move(d));
         return name;
      }
   };  // abi_generator
}  // namespace eosio

#define EOSIO_ABIGEN_MATCH_ACTIONS(x) EOSIO_MATCH(EOSIO_ABIGEN_MATCH_ACTIONS, x)
#define EOSIO_ABIGEN_MATCH_ACTIONSactions EOSIO_MATCH_YES
#define EOSIO_ABIGEN_EXTRACT_ACTIONS_NS(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_ACTIONS_NS, x)
#define EOSIO_ABIGEN_EXTRACT_ACTIONS_NSactions(ns) ns

#define EOSIO_ABIGEN_MATCH_TABLE(x) EOSIO_MATCH(EOSIO_ABIGEN_MATCH_TABLE, x)
#define EOSIO_ABIGEN_MATCH_TABLEtable EOSIO_MATCH_YES
#define EOSIO_ABIGEN_EXTRACT_TABLE_NAME(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_TABLE_NAME, x)
#define EOSIO_ABIGEN_EXTRACT_TABLE_NAMEtable(name, type) name
#define EOSIO_ABIGEN_EXTRACT_TABLE_TYPE(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_TABLE_TYPE, x)
#define EOSIO_ABIGEN_EXTRACT_TABLE_TYPEtable(name, type) type

#define EOSIO_ABIGEN_MATCH_VARIANT(x) EOSIO_MATCH(EOSIO_ABIGEN_MATCH_VARIANT, x)
#define EOSIO_ABIGEN_MATCH_VARIANTvariant EOSIO_MATCH_YES
#define EOSIO_ABIGEN_EXTRACT_VARIANT_NAME(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_VARIANT_NAME, x)
#define EOSIO_ABIGEN_EXTRACT_VARIANT_NAMEvariant(name, type, ...) name
#define EOSIO_ABIGEN_EXTRACT_VARIANT_TYPE(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_VARIANT_TYPE, x)
#define EOSIO_ABIGEN_EXTRACT_VARIANT_TYPEvariant(name, type, ...) type

#define EOSIO_ABIGEN_MATCH_CLAUSE(x) EOSIO_MATCH(EOSIO_ABIGEN_MATCH_CLAUSE, x)
#define EOSIO_ABIGEN_MATCH_CLAUSEricardian_clause EOSIO_MATCH_YES
#define EOSIO_ABIGEN_EXTRACT_CLAUSE_ID(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_CLAUSE_ID, x)
#define EOSIO_ABIGEN_EXTRACT_CLAUSE_IDricardian_clause(id, body) id
#define EOSIO_ABIGEN_EXTRACT_CLAUSE_BODY(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_CLAUSE_BODY, x)
#define EOSIO_ABIGEN_EXTRACT_CLAUSE_BODYricardian_clause(id, body) body

#define EOSIO_ABIGEN_HAS_VARIANT_ARGS(x) \
   BOOST_PP_COMPL(BOOST_PP_CHECK_EMPTY(EOSIO_ABIGEN_EXTRACT_VARIANT_ARGS(x)))
#define EOSIO_ABIGEN_EXTRACT_VARIANT_ARGS(x) BOOST_PP_CAT(EOSIO_ABIGEN_EXTRACT_VARIANT_ARGS, x)
#define EOSIO_ABIGEN_EXTRACT_VARIANT_ARGSvariant(name, type, ...) __VA_ARGS__

#define EOSIO_ABIGEN_ACTION(actions)                                                     \
   EOSIO_ABIGEN_EXTRACT_ACTIONS_NS(actions)::for_each_action(                            \
       [&](auto name, auto wrapper, const auto& ricardian_contract, auto... arg_names) { \
          gen.add_action(name, wrapper, ricardian_contract, arg_names...);               \
       });

#define EOSIO_ABIGEN_TABLE(table) \
   gen.add_table<EOSIO_ABIGEN_EXTRACT_TABLE_TYPE(table)>(EOSIO_ABIGEN_EXTRACT_TABLE_NAME(table));

#define EOSIO_ABIGEN_VARIANT(variant)                                \
   gen.add_variant<EOSIO_ABIGEN_EXTRACT_VARIANT_TYPE(variant)>(      \
       EOSIO_ABIGEN_EXTRACT_VARIANT_NAME(variant)                    \
           BOOST_PP_COMMA_IF(EOSIO_ABIGEN_HAS_VARIANT_ARGS(variant)) \
               EOSIO_ABIGEN_EXTRACT_VARIANT_ARGS(variant));

#define EOSIO_ABIGEN_CLAUSE(clause)              \
   gen.def.ricardian_clauses.push_back({         \
       EOSIO_ABIGEN_EXTRACT_CLAUSE_ID(clause),   \
       EOSIO_ABIGEN_EXTRACT_CLAUSE_BODY(clause), \
   });

#define EOSIO_ABIGEN_ITEM(r, data, item)                                                    \
   BOOST_PP_IIF(EOSIO_ABIGEN_MATCH_ACTIONS(item), EOSIO_ABIGEN_ACTION, EOSIO_EMPTY)(item);  \
   BOOST_PP_IIF(EOSIO_ABIGEN_MATCH_TABLE(item), EOSIO_ABIGEN_TABLE, EOSIO_EMPTY)(item);     \
   BOOST_PP_IIF(EOSIO_ABIGEN_MATCH_VARIANT(item), EOSIO_ABIGEN_VARIANT, EOSIO_EMPTY)(item); \
   BOOST_PP_IIF(EOSIO_ABIGEN_MATCH_CLAUSE(item), EOSIO_ABIGEN_CLAUSE, EOSIO_EMPTY)(item);

#define EOSIO_ABIGEN(...)                                                                \
   int main()                                                                            \
   {                                                                                     \
      eosio::abi_generator gen;                                                          \
      gen.add_builtin_types();                                                           \
      BOOST_PP_SEQ_FOR_EACH(EOSIO_ABIGEN_ITEM, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
      eosio::print(eosio::format_json(gen.def), "\n");                                   \
   }
