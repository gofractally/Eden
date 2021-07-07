#pragma once

#include <cctype>
#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/for_each_field.hpp>
#include <eosio/name.hpp>
#include <eosio/stream.hpp>
#include <eosio/time.hpp>
#include <eosio/types.hpp>
#include <set>
#include <typeindex>

namespace clchain
{
   struct gql_stream;
}

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

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value,
                  clchain::gql_stream& input_stream,
                  OS& output_stream,
                  const E& error) -> std::enable_if_t<use_json_string_for_gql((T*)nullptr), bool>
   {
      to_json(value, output_stream);
      return true;
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

   struct gql_stream
   {
      enum token_type
      {
         unstarted,
         eof,
         error,
         punctuator,
         name,
      };

      eosio::input_stream input;
      token_type current_type = unstarted;
      std::string_view current_value;
      char current_puncuator = 0;

      gql_stream(eosio::input_stream input) : input{input} { get_next(); }
      gql_stream(const gql_stream&) = default;
      gql_stream& operator=(const gql_stream&) = default;

      token_type get_next()
      {
         if (current_type == error)
            return error;
         current_puncuator = 0;
         current_value = {};
         while (true)
         {
            if (!input.remaining())
               return (current_type = eof);
            switch (input.pos[0])
            {
               case '\n':
               case '\r':
               case ' ':
               case '\t':
               case ',':
                  ++input.pos;
                  continue;
               case '#':
                  while (input.remaining() && (input.pos[0] != '\n' && input.pos[0] != '\r'))
                     ++input.pos;
                  continue;
               case '$':
               case '!':
               case '&':
               case '(':
               case ')':
               case ':':
               case '=':
               case '@':
               case '[':
               case ']':
               case '{':
               case '|':
               case '}':
                  current_puncuator = input.pos[0];
                  ++input.pos;
                  return (current_type = punctuator);
               case '.':
                  if (input.remaining() >= 3 && input.pos[1] == '.' && input.pos[2] == '.')
                  {
                     current_puncuator = '.';
                     input.pos += 3;
                     return (current_type = punctuator);
                  }
                  break;
               default:;
            }  // switch (input.pos[0])

            if (input.pos[0] == '_' || std::isalpha((unsigned char)input.pos[0]))
            {
               auto begin = input.pos;
               while (input.remaining() &&
                      (input.pos[0] == '_' || std::isalnum((unsigned char)input.pos[0])))
                  ++input.pos;
               current_value = {begin, size_t(input.pos - begin)};
               return (current_type = name);
            }
            else
            {
               return (current_type = error);
            }
         }  // while (true)
      }     // get_next()
   };       // gql_stream

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<std::is_arithmetic_v<T> || std::is_same_v<T, std::string>, bool>
   {
      eosio::to_json(value, output_stream);
      return true;
   }

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<eosio::is_serializable_container<T>::value, bool>
   {
      output_stream.write('[');
      bool first = true;
      for (auto& v : value)
      {
         if (first)
            increase_indent(output_stream);
         else
            output_stream.write(',');
         write_newline(output_stream);
         first = false;
         // TODO: fix input_stream handling
         if (!gql_query(v, input_stream, output_stream, error))
            return false;
      }
      if (!first)
      {
         decrease_indent(output_stream);
         write_newline(output_stream);
      }
      output_stream.write(']');
      return true;
   }

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<eosio::reflection::has_for_each_field_v<T> &&
                               !has_get_gql_name<T>::value,
                           bool>
   {
      if (input_stream.current_puncuator != '{')
         return error("expected {");
      input_stream.get_next();
      bool first = true;
      output_stream.write('{');
      while (input_stream.current_type == gql_stream::name)
      {
         bool found = false;
         bool have_error = false;
         eosio::for_each_field<T>([&](std::string_view name, auto&& member) {
            if (found)
               return;
            if (name == input_stream.current_value)
            {
               found = true;
               input_stream.get_next();
               if (first)
               {
                  increase_indent(output_stream);
                  first = false;
               }
               else
                  output_stream.write(',');
               write_newline(output_stream);
               to_json(name, output_stream);
               write_colon(output_stream);
               if (!gql_query(member(&value), input_stream, output_stream, error))
                  have_error = true;
            }
         });
         if (have_error)
            return false;
         if (!found)
            return error((std::string)input_stream.current_value + " not found");
      }
      if (input_stream.current_puncuator != '}')
         return error("expected }");
      input_stream.get_next();
      if (!first)
      {
         decrease_indent(output_stream);
         write_newline(output_stream);
      }
      output_stream.write('}');
      return true;
   }

   template <typename T>
   std::string format_gql_query(const T& value, std::string_view query)
   {
      gql_stream input_stream{query};
      std::string result;
      eosio::pretty_stream<eosio::string_stream> output_stream(result);
      std::string error;
      if (!gql_query(value, input_stream, output_stream, [&](const auto& e) {
             error = e;
             return false;
          }))
         return error;
      return result;
   }
}  // namespace clchain
