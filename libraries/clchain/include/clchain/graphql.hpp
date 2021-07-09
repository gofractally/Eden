#pragma once

#include <cctype>
#include <charconv>
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
      using T = eosio::remove_cvref_t<Raw>;
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
      using T = eosio::remove_cvref_t<Raw>;
      if constexpr (eosio::is_std_optional<T>())
         return generate_gql_whole_name((typename T::value_type*)nullptr, true);
      else if constexpr (std::is_pointer<T>())
         return generate_gql_whole_name((T) nullptr, true);
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
      using T = eosio::remove_cvref_t<Raw>;
      if constexpr (eosio::is_std_optional<T>())
         fill_gql_schema((typename T::value_type*)nullptr, stream, defined_types);
      else if constexpr (std::is_pointer<T>())
         fill_gql_schema((T) nullptr, stream, defined_types);
      else if constexpr (eosio::is_std_unique_ptr<T>())
         fill_gql_schema((typename T::element_type*)nullptr, stream, defined_types);
      else if constexpr (eosio::is_serializable_container<T>())
         fill_gql_schema((typename T::value_type*)nullptr, stream, defined_types);
      else if constexpr (eosio::reflection::has_for_each_field_v<T> && !has_get_gql_name<T>::value)
      {
         if (defined_types.insert(typeid(T)).second)
         {
            eosio::for_each_field<T>([&](const char*, auto member) {
               fill_gql_schema((eosio::remove_cvref_t<decltype(member((T*)nullptr))>*)nullptr,
                               stream, defined_types);
            });
            eosio::for_each_method<T>([&](const char* name, auto member, auto... arg_names) {
               using mf = eosio::member_fn<decltype(member)>;
               using ret = eosio::remove_cvref_t<typename mf::return_type>;
               if constexpr (mf::is_const)
               {
                  eosio::for_each_named_type(
                      [&](auto* p, const char*) {  //
                         fill_gql_schema(p, stream, defined_types);
                      },
                      typename mf::arg_types{}, arg_names...);
                  fill_gql_schema((ret*)nullptr, stream, defined_types);
               }
            });
            stream.write_str("type ");
            stream.write_str(generate_gql_partial_name((Raw*)nullptr));
            stream.write_str(" {\n");
            eosio::for_each_field<T>([&](const char* name, auto member) {
               stream.write_str("    ");
               stream.write_str(name);
               stream.write_str(": ");
               stream.write_str(generate_gql_whole_name(
                   (eosio::remove_cvref_t<decltype(member((T*)nullptr))>*)nullptr));
               stream.write_str("\n");
            });
            eosio::for_each_method<T>([&](const char* name, auto member, auto... arg_names) {
               using mf = eosio::member_fn<decltype(member)>;
               using ret = eosio::remove_cvref_t<typename mf::return_type>;
               if constexpr (mf::is_const)
               {
                  stream.write_str("    ");
                  stream.write_str(name);
                  if constexpr (mf::arg_types::size)
                  {
                     stream.write_str("(");
                     bool first = true;
                     eosio::for_each_named_type(
                         [&](auto* p, const char* name) {
                            if (!first)
                               stream.write_str(", ");
                            stream.write_str(name);
                            stream.write_str(": ");
                            stream.write_str(generate_gql_whole_name(p));
                            first = false;
                         },
                         typename mf::arg_types{}, arg_names...);
                     stream.write_str("): ");
                  }
                  stream.write_str(generate_gql_whole_name((ret*)nullptr));
                  stream.write_str("\n");
               }
            });
            stream.write_str("}\n");
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
         string,
         integer,
         floating,
      };

      eosio::input_stream input;
      token_type current_type = unstarted;
      std::string_view current_value;
      char current_puncuator = 0;

      gql_stream(eosio::input_stream input) : input{input} { skip(); }
      gql_stream(const gql_stream&) = default;
      gql_stream& operator=(const gql_stream&) = default;

      void skip()
      {
         if (current_type == error)
            return;
         current_puncuator = 0;
         current_value = {};
         while (true)
         {
            auto begin = input.pos;
            if (!input.remaining())
            {
               current_type = eof;
               return;
            }
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
                  current_value = {begin, size_t(input.pos - begin)};
                  current_type = punctuator;
                  return;
               case '.':
                  if (input.remaining() >= 3 && input.pos[1] == '.' && input.pos[2] == '.')
                  {
                     current_puncuator = '.';
                     input.pos += 3;
                     current_value = {begin, size_t(input.pos - begin)};
                     current_type = punctuator;
                     return;
                  }
                  break;
               case '"':
                  ++input.pos;
                  while (input.remaining() && input.pos[0] != '"')
                  {
                     auto ch = *input.pos++;
                     if (ch == '\\')
                     {
                        if (!input.remaining())
                           return;
                        ++input.pos;
                     }
                  }
                  if (!input.remaining())
                     return;
                  ++input.pos;
                  current_value = {begin, size_t(input.pos - begin)};
                  current_type = string;
               default:;
            }  // switch (input.pos[0])

            if (input.pos[0] == '_' || std::isalpha((unsigned char)input.pos[0]))
            {
               while (input.remaining() &&
                      (input.pos[0] == '_' || std::isalnum((unsigned char)input.pos[0])))
                  ++input.pos;
               current_value = {begin, size_t(input.pos - begin)};
               current_type = name;
               return;
            }
            else if (input.pos[0] == '-' || std::isdigit((unsigned char)input.pos[0]))
            {
               current_type = integer;
               if (input.pos[0] == '-')
               {
                  ++input.pos;
                  if (!input.remaining() || !std::isdigit((unsigned char)input.pos[0]))
                  {
                     current_type = error;
                     return;
                  }
               }
               if (input.pos[0] == '0')
                  ++input.pos;
               else
                  while (input.remaining() && std::isdigit((unsigned char)input.pos[0]))
                     ++input.pos;
               if (input.remaining() && input.pos[0] == '.')
               {
                  ++input.pos;
                  current_type = floating;
                  if (!input.remaining() || !std::isdigit((unsigned char)input.pos[0]))
                  {
                     current_type = error;
                     return;
                  }
                  while (input.remaining() && std::isdigit((unsigned char)input.pos[0]))
                     ++input.pos;
               }
               if (input.remaining() && (input.pos[0] == 'e' || input.pos[0] == 'E'))
               {
                  ++input.pos;
                  current_type = floating;
                  if (input.remaining() && input.pos[0] == '-')
                     ++input.pos;
                  if (!input.remaining() || !std::isdigit((unsigned char)input.pos[0]))
                  {
                     current_type = error;
                     return;
                  }
                  while (input.remaining() && std::isdigit((unsigned char)input.pos[0]))
                     ++input.pos;
               }
               if (input.remaining() &&
                   (input.pos[0] == '_' || std::isalnum((unsigned char)input.pos[0])))
               {
                  current_type = error;
                  return;
               }
               current_value = {begin, size_t(input.pos - begin)};
               return;
            }  // numbers
            else
            {
               current_value = {begin, size_t(input.pos - begin)};
               current_type = error;
               return;
            }
         }  // while (true)
      }     // skip()
   };       // gql_stream

   template <typename T, typename E>
   auto gql_parse_arg(T& arg, gql_stream& input_stream, const E& error)
       -> std::enable_if_t<std::is_arithmetic_v<T> || std::is_same_v<T, bool>, bool>
   {
      if constexpr (std::is_same_v<T, bool>)
      {
         if (input_stream.current_value == "true")
         {
            input_stream.skip();
            arg = true;
            return true;
         }
         else if (input_stream.current_value == "false")
         {
            input_stream.skip();
            arg = false;
            return true;
         }
         else
            return error("expected Boolean");
      }
      else
      {
         if (input_stream.current_type != gql_stream::integer &&
             input_stream.current_type != gql_stream::floating &&
             input_stream.current_type != gql_stream::string)
            return error("expected number or stringified number");
         auto begin = input_stream.current_value.data();
         auto end = begin + input_stream.current_value.size();
         auto result = std::from_chars<T>(begin, end, arg);
         if (result.ec == std::errc{} && result.ptr == end)
         {
            input_stream.skip();
            return true;
         }
         if (result.ec == std::errc::result_out_of_range)
            return error("number is out of range");
         return error("expected number or stringified number");
      }
   }

   template <int i, typename... Args, typename E, typename... Arg_names>
   bool gql_parse_args(std::tuple<Args...>& args,
                       gql_stream& input_stream,
                       const E& error,
                       const char* arg_name,
                       Arg_names... arg_names)
   {
      if (input_stream.current_type != gql_stream::name || input_stream.current_value != arg_name)
         return error("expected " + std::string(arg_name) + " (argument order is enforced)");
      input_stream.skip();
      if (input_stream.current_puncuator != ':')
         return error("expected :");
      input_stream.skip();
      if (!gql_parse_arg(std::get<i>(args), input_stream, error))
         return false;
      return gql_parse_args<i + 1>(args, input_stream, error);
   }

   template <int i, typename... Args, typename E>
   bool gql_parse_args(std::tuple<Args...>& args, gql_stream& input_stream, const E& error)
   {
      static_assert(i == sizeof...(Args), "mismatched arg names");
      return true;
   }

   template <typename E>
   bool gql_skip_selection_set(gql_stream& input_stream, const E& error)
   {
      if (input_stream.current_puncuator != '{')
         return true;
      input_stream.skip();
      while (true)
      {
         if (input_stream.current_type == gql_stream::eof)
            return error("expected }");
         else if (input_stream.current_puncuator == '{')
         {
            if (!gql_skip_selection_set(input_stream, error))
               return false;
         }
         else if (input_stream.current_puncuator == '}')
         {
            input_stream.skip();
            return true;
         }
         else
            input_stream.skip();
      }
   }

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<std::is_arithmetic_v<T> || std::is_same_v<T, std::string>, bool>
   {
      eosio::to_json(value, output_stream);
      return true;
   }

   template <typename T, typename OS, typename E>
   auto gql_query(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<eosio::is_std_optional<T>() || std::is_pointer<T>() ||
                               eosio::is_std_unique_ptr<T>(),
                           bool>

   {
      if (value)
         return gql_query(*value, input_stream, output_stream, error);
      output_stream.write_str("null");
      return gql_skip_selection_set(input_stream, error);
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
         auto copy = input_stream;
         if (!gql_query(v, copy, output_stream, error))
            return false;
      }
      if (!gql_skip_selection_set(input_stream, error))
         return false;
      if (!first)
      {
         decrease_indent(output_stream);
         write_newline(output_stream);
      }
      output_stream.write(']');
      return true;
   }

   template <typename Raw, typename OS, typename E>
   auto gql_query(const Raw& value, gql_stream& input_stream, OS& output_stream, const E& error)
       -> std::enable_if_t<eosio::reflection::has_for_each_field_v<Raw> &&
                               !has_get_gql_name<Raw>::value,
                           bool>
   {
      using T = eosio::remove_cvref_t<Raw>;
      if (input_stream.current_puncuator != '{')
         return error("expected {");
      input_stream.skip();
      bool first = true;
      output_stream.write('{');
      while (input_stream.current_type == gql_stream::name)
      {
         bool found = false;
         bool ok = true;
         auto alias = input_stream.current_value;
         auto field_name = alias;
         input_stream.skip();
         if (input_stream.current_puncuator == ':')
         {
            input_stream.skip();
            if (input_stream.current_type != gql_stream::name)
               return error("expected name after :");
            field_name = input_stream.current_value;
            input_stream.skip();
         }
         eosio_for_each_field(
             (T*)nullptr, [&](std::string_view name, auto&& member, auto... arg_names) {
                using member_type = decltype(member((T*)nullptr));
                if constexpr (eosio::is_non_const_member_fn<member_type>())
                   return;
                else
                {
                   if (found)
                      return;
                   if (name == field_name)
                   {
                      found = true;
                      if (first)
                      {
                         increase_indent(output_stream);
                         first = false;
                      }
                      else
                         output_stream.write(',');
                      write_newline(output_stream);
                      to_json(alias, output_stream);
                      write_colon(output_stream);
                      if constexpr (std::is_member_object_pointer_v<member_type>)
                      {
                         if (!gql_query(value.*member(&value), input_stream, output_stream, error))
                            ok = false;
                      }
                      else
                      {
                         using mf = eosio::member_fn<member_type>;
                         if (input_stream.current_puncuator != '(')
                            return (ok = error("expected (")), void();
                         input_stream.skip();
                         eosio::tuple_from_type_list<typename mf::arg_types> args;
                         if (!gql_parse_args<0>(args, input_stream, error, arg_names...))
                            return (ok = false), void();
                         if (input_stream.current_puncuator != ')')
                            return (ok = error("expected )")), void();
                         input_stream.skip();

                         auto result = std::apply(
                             [&](auto&&... args) {
                                return (value.*member(&value))(std::move(args)...);
                             },
                             args);
                         if (!gql_query(result, input_stream, output_stream, error))
                            return (ok = false), void();
                      }
                   }
                }
             });
         if (!ok)
            return false;
         if (!found)
            return error((std::string)field_name + " not found");
      }
      if (input_stream.current_puncuator != '}')
         return error("expected }");
      input_stream.skip();
      if (!first)
      {
         decrease_indent(output_stream);
         write_newline(output_stream);
      }
      output_stream.write('}');
      return true;
   }

   template <typename T, typename OS, typename E>
   bool gql_query_root(const T& value, gql_stream& input_stream, OS& output_stream, const E& error)
   {
      if (input_stream.current_type == gql_stream::name)
      {
         if (input_stream.current_value == "query")
            input_stream.skip();
         else
            return error("expected query");
      }
      if (!gql_query(value, input_stream, output_stream, error))
         return false;
      if (input_stream.current_type == gql_stream::eof)
         return true;
      return error("expected end of input");
   }

   template <typename Stream = eosio::string_stream, typename T>
   std::string gql_query(const T& value, std::string_view query)
   {
      gql_stream input_stream{query};
      std::string result;
      Stream output_stream(result);
      output_stream.write('{');
      increase_indent(output_stream);
      write_newline(output_stream);
      output_stream.write_str("\"data\": ");
      std::string error;
      if (!gql_query_root(value, input_stream, output_stream, [&](const auto& e) {
             error = e;
             return false;
          }))
      {
         result.clear();
         Stream error_stream(result);
         error_stream.write('{');
         increase_indent(error_stream);
         write_newline(error_stream);
         error_stream.write_str("\"errors\": {");
         increase_indent(error_stream);
         write_newline(error_stream);
         error_stream.write_str("\"message\": ");
         eosio::to_json(error, error_stream);
         decrease_indent(error_stream);
         write_newline(error_stream);
         error_stream.write('}');
         decrease_indent(error_stream);
         write_newline(error_stream);
         error_stream.write('}');
         return result;
      }
      decrease_indent(output_stream);
      write_newline(output_stream);
      output_stream.write('}');
      return result;
   }

   template <typename T>
   std::string format_gql_query(const T& value, std::string_view query)
   {
      return gql_query<eosio::pretty_stream<eosio::string_stream>>(value, query);
   }
}  // namespace clchain
