#pragma once

#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/for_each_field.hpp>
#include <eosio/name.hpp>
#include <eosio/stream.hpp>
#include <eosio/time.hpp>
#include <eosio/types.hpp>
#include <set>
#include <typeindex>

namespace eosio
{
   template <typename T>
   constexpr bool use_json_string_for_gql(T*)
   {
      return false;
   }

   inline constexpr bool use_json_string_for_gql(bytes*) { return true; }
   inline constexpr bool use_json_string_for_gql(name*) { return true; }
   inline constexpr bool use_json_string_for_gql(time_point*) { return true; }

   template <typename T, std::size_t Size>
   constexpr bool use_json_string_for_gql(fixed_bytes<Size, T>*)
   {
      return true;
   }

   template <typename T>
   auto get_gql_name(T*) -> std::enable_if_t<use_json_string_for_gql((T*)nullptr), const char*>
   {
      return "String";
   }
}  // namespace eosio

namespace clchain
{
   template <typename T>
   struct has_get_gql_name
   {
     private:
      template <typename C>
      static char test(decltype(get_gql_name((C*)nullptr))*);

      template <typename C>
      static long test(...);

     public:
      static constexpr bool value = sizeof(test<T>((const char**)nullptr)) == sizeof(char);
   };

   template <typename Raw>
   std::string generate_gql_whole_name(Raw*, bool is_optional = false);

   template <typename Raw>
   std::string generate_gql_partial_name(Raw*)
   {
      using T = std::remove_cvref_t<Raw>;
      if constexpr (std::is_same_v<T, bool>)
         return "Boolean";
      else if constexpr (std::is_integral_v<T>)
      {
         if constexpr (std::is_signed_v<T> && sizeof(T) <= 4)
            return "Int";
         else if constexpr (std::is_unsigned_v<T> && sizeof(T) <= 2)
            return "Int";
         else if constexpr (sizeof(T) <= 4)
            return "Float";
         else
            return "String";
      }
      else if constexpr (std::is_same_v<T, float> || std::is_same_v<T, double>)
         return "Float";
      else if constexpr (std::is_same_v<T, std::string>)
         return "String";
      else if constexpr (eosio::is_serializable_container<T>())
         return "[" + generate_gql_whole_name((typename T::value_type*)nullptr) + "]";
      else if constexpr (eosio::reflection::has_for_each_field_v<T> && !has_get_gql_name<T>::value)
         return get_type_name((T*)nullptr);
      else
         return get_gql_name((T*)nullptr);
   }

   template <typename Raw>
   std::string generate_gql_whole_name(Raw*, bool is_optional)
   {
      using T = std::remove_cvref_t<Raw>;
      if constexpr (eosio::is_std_optional<T>())
         return generate_gql_whole_name((typename T::value_type*)nullptr, true);
      else if constexpr (eosio::is_std_unique_ptr<T>())
         return generate_gql_whole_name((typename T::element_type*)nullptr, true);
      else if (is_optional)
         return generate_gql_partial_name((Raw*)nullptr);
      else
         return generate_gql_partial_name((Raw*)nullptr) + "!";
   }

   template <typename Raw, typename S>
   void fill_gql_schema(Raw*, S& stream, std::set<std::type_index>& defined_types)
   {
      using T = std::remove_cvref_t<Raw>;
      if constexpr (eosio::is_std_optional<T>())
         fill_gql_schema((typename T::value_type*)nullptr, stream, defined_types);
      else if constexpr (eosio::is_std_unique_ptr<T>())
         fill_gql_schema((typename T::element_type*)nullptr, stream, defined_types);
      else if constexpr (eosio::is_serializable_container<T>())
         fill_gql_schema((typename T::value_type*)nullptr, stream, defined_types);
      else if constexpr (eosio::reflection::has_for_each_field_v<T> && !has_get_gql_name<T>::value)
      {
         if (defined_types.insert(typeid(T)).second)
         {
            eosio::for_each_field<T>([&](const char*, auto member) {
               fill_gql_schema((std::remove_cvref_t<decltype(member((T*)nullptr))>*)nullptr, stream,
                               defined_types);
            });
            stream.write("type ");
            stream.write(generate_gql_partial_name((Raw*)nullptr));
            stream.write(" {\n");
            eosio::for_each_field<T>([&](const char* name, auto member) {
               stream.write("    ");
               stream.write(name);
               stream.write(": ");
               stream.write(generate_gql_whole_name(
                   (std::remove_cvref_t<decltype(member((T*)nullptr))>*)nullptr));
               stream.write("\n");
            });
            stream.write("}\n");
         }
      }
   }

   template <typename Raw, typename S>
   void fill_gql_schema(Raw*, S& stream)
   {
      std::set<std::type_index> defined_types;
      fill_gql_schema((Raw*)nullptr, stream, defined_types);
   }

   template <typename T>
   std::string get_gql_schema(T* p = nullptr)
   {
      eosio::size_stream ss;
      fill_gql_schema((T*)nullptr, ss);
      std::string result(ss.size, 0);
      eosio::fixed_buf_stream fbs(result.data(), result.size());
      fill_gql_schema((T*)nullptr, fbs);
      eosio::check(fbs.pos == fbs.end, eosio::convert_stream_error(eosio::stream_error::underrun));
      return result;
   }
}  // namespace clchain
