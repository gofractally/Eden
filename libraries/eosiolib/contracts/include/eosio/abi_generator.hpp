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
      eosio::abi_def def{"eosio::abi/1.3"};
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
         if constexpr (!std::is_same_v<void, typename decltype(wrapper)::return_type>)
         {
            def.action_results.value.push_back(
                {name, get_type<typename decltype(wrapper)::return_type>()});
         }
      }

      template <uint32_t i, typename T, typename... Ts, typename N, typename... Ns>
      void add_action_args(struct_def& def, std::tuple<T, Ts...>*, N name, Ns... names)
      {
         if constexpr (!is_not_in_abi((remove_cvref_t<T>*)nullptr))
            def.fields.push_back({name, get_type<T>()});
         add_action_args<i + 1>(def, (std::tuple<Ts...>*)nullptr, names...);
      }

      template <uint32_t i, typename T, typename... Ts>
      void add_action_args(struct_def& def, std::tuple<T, Ts...>*)
      {
         if constexpr (!is_not_in_abi((remove_cvref_t<T>*)nullptr))
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

#define EOSIO_ABIGEN_KNOWN_ITEM1(item) BOOST_PP_TUPLE_ELEM(0, BOOST_PP_VARIADIC_TO_TUPLE(item))
#define EOSIO_ABIGEN_KNOWN_ITEM(item) \
   EOSIO_ABIGEN_KNOWN_ITEM1(BOOST_PP_CAT(EOSIO_ABIGEN_ITEM, item))
#define EOSIO_ABIGEN_UNKNOWN_ITEM(item) \
   eosio::check(false,                  \
                "unrecognized item in EOSIO_ABIGEN(): " + std::string(BOOST_PP_STRINGIZE(item)));
#define EOSIO_ABIGEN_ITEM(r, data, item)                                       \
   BOOST_PP_IIF(EOSIO_MATCH(EOSIO_ABIGEN_ITEM, item), EOSIO_ABIGEN_KNOWN_ITEM, \
                EOSIO_ABIGEN_UNKNOWN_ITEM)                                     \
   (item)

#define EOSIO_ABIGEN_ITEMactions(ns)                                                     \
   ns::for_each_action(                                                                  \
       [&](auto name, auto wrapper, const auto& ricardian_contract, auto... arg_names) { \
          gen.add_action(name, wrapper, ricardian_contract, arg_names...);               \
       });                                                                               \
   , 1

#define EOSIO_ABIGEN_ITEMtable(name, type) \
   gen.add_table<type>(name);              \
   , 1

#define EOSIO_ABIGEN_ITEMvariant(name, type, ...)                                                  \
   gen.add_variant<type>(name BOOST_PP_COMMA_IF(BOOST_PP_COMPL(BOOST_PP_CHECK_EMPTY(__VA_ARGS__))) \
                             __VA_ARGS__);                                                         \
   , 1

#define EOSIO_ABIGEN_ITEMricardian_clause(id, body) \
   gen.def.ricardian_clauses.push_back({id, body}); \
   , 1

#define EOSIO_ABIGEN(...)                                                                \
   int main()                                                                            \
   {                                                                                     \
      eosio::abi_generator gen;                                                          \
      gen.add_builtin_types();                                                           \
      BOOST_PP_SEQ_FOR_EACH(EOSIO_ABIGEN_ITEM, _, BOOST_PP_VARIADIC_TO_SEQ(__VA_ARGS__)) \
      eosio::print(eosio::format_json(gen.def), "\n");                                   \
   }
