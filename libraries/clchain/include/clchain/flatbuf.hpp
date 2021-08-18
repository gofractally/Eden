// TODO: const support

#pragma once

#include <eosio/for_each_field.hpp>
#include <eosio/name.hpp>
#include <eosio/reflection2.hpp>
#include <eosio/stream.hpp>
#include <eosio/types.hpp>

namespace clio
{
   template <typename T>
   constexpr uint64_t get_type_hashname()
   {
      return eosio::hash_name(get_type_name((T*)nullptr));
   }

   struct flat_view_proxy_impl;

   template <typename T>
   class flat_ptr;

   template <typename>
   struct is_flat_ptr : std::false_type
   {
   };

   template <typename T>
   struct is_flat_ptr<flat_ptr<T>> : std::true_type
   {
      using value_type = T;
   };

   template <typename T>
   class flat
   {
      using T::flat_type_not_defined;
   };

   template <>
   class flat<std::string>;

   template <typename T>
   class flat<flat_ptr<T>>;

   template <typename T>
   class flat<std::vector<T>>;

   template <typename... Ts>
   class flat<std::variant<Ts...>>;

   inline constexpr uint32_t flat_variant_size = 16;
   inline constexpr uint32_t flat_variant_data_size = 8;

   template <typename T>
   auto get_view_type()
   {
      //        if constexpr( is_flat_ptr<T>() ) {
      //            return get_view_type<typename T::value_type>();
      if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         using view_type =
             decltype(eosio_get_proxy_type((T*)nullptr, (flat_view_proxy_impl*)nullptr));
         return (view_type*)nullptr;
      }
      else if constexpr (std::is_integral_v<T> || std::is_floating_point_v<T>)
         return (T*)nullptr;
      else
         return (flat<T>*)nullptr;
   }

   template <typename T>
   using flat_view = std::remove_pointer_t<decltype(get_view_type<T>())>;

   struct offset_ptr
   {
      uint32_t offset;

      template <typename T>
      auto get() const
      {
         const auto ptr = ((char*)this) + offset;
         if constexpr (is_flat_ptr<T>())
         {
            return reinterpret_cast<flat_view<T>*>(ptr + 4);
         }
         else if constexpr (eosio::reflection::has_for_each_field_v<T>)
         {
            return reinterpret_cast<flat_view<T>*>(ptr);
         }
         else if constexpr (std::is_same_v<std::string, T>)
         {
            return reinterpret_cast<flat<std::string>*>(ptr);
         }
         else if constexpr (eosio::is_std_vector<T>())
         {
            return reinterpret_cast<flat<T>*>(ptr);
         }
         else
         {
            T::is_not_reflected_for_offset_ptr;
         }
      }
   };

   /**
    *  Recursively checks the types for any field which requires dynamic allocation
    */
   template <typename T>
   constexpr bool contains_offset_ptr(T*);

   template <typename... Ts>
   constexpr bool contains_offset_ptr(std::variant<Ts...>*)
   {
      return (... || contains_offset_ptr((Ts*)nullptr));
   }

   template <typename T>
   constexpr bool contains_offset_ptr(T*)
   {
      if constexpr (is_flat_ptr<T>())
         return true;
      else if constexpr (std::is_same_v<std::string, T>)
         return true;
      else if constexpr (eosio::is_std_vector<T>())
         return true;
      else if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         bool have_ptr = false;
         eosio::for_each_field<T>([&](auto, auto member) {
            using member_type = eosio::remove_cvref_t<decltype(member((T*)nullptr))>;
            have_ptr |= contains_offset_ptr((member_type*)nullptr);
         });
         return have_ptr;
      }
      else if constexpr (std::is_integral_v<T> || std::is_floating_point_v<T>)
         return false;
      else
         T::contains_offset_ptr_not_defined;
   }

   template <typename T>
   constexpr uint32_t flatpack_size()
   {
      if constexpr (is_flat_ptr<T>())
         return sizeof(offset_ptr);
      else if constexpr (eosio::is_std_variant<T>())
         return flat_variant_size;
      else if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         uint32_t size = 0;
         eosio::for_each_field<T>([&](auto, auto member) {
            using member_type = eosio::remove_cvref_t<decltype(member((T*)nullptr))>;
            if constexpr (contains_offset_ptr((member_type*)nullptr))
               size += sizeof(offset_ptr);
            else
               size += flatpack_size<member_type>();
         });
         return size;
      }
      else if constexpr (std::is_same_v<std::string, T> || eosio::is_std_vector<T>())
         return sizeof(offset_ptr);
      else if constexpr (std::is_integral_v<T> || std::is_floating_point_v<T>)
         return sizeof(T);
      else
         T::flatpack_size_not_defined;
   }

   template <uint32_t Idx, typename T>
   constexpr uint32_t get_offset()
   {
      uint32_t offset = 0;
      uint32_t i = 0;
      eosio_for_each_field((T*)nullptr, [&](const char*, auto member, auto...) {
         if (i >= Idx)
            return;
         if constexpr (std::is_member_object_pointer_v<decltype(member((T*)nullptr))>)
         {
            using m = eosio::remove_cvref_t<decltype(std::declval<T>().*member((T*)nullptr))>;
            if constexpr (contains_offset_ptr((m*)nullptr))
               offset += sizeof(offset_ptr);
            else
               offset += flatpack_size<m>();
         }
         ++i;
      });
      return offset;
   }

   struct flat_view_proxy_impl
   {
      flat_view_proxy_impl() = delete;
      flat_view_proxy_impl(const flat_view_proxy_impl&) = delete;
      ~flat_view_proxy_impl() = delete;
      flat_view_proxy_impl& operator=(const flat_view_proxy_impl&) = delete;

      /** This method is called by the reflection library to get the field */
      template <uint32_t idx, auto MemberPtr>
      constexpr auto get()
      {
         using mo = eosio::member_object<decltype(MemberPtr)>;
         using member_type = typename mo::member_type;
         constexpr uint32_t offset = get_offset<idx, typename mo::class_type>();
         auto out_ptr = reinterpret_cast<char*>(this) + offset;
         if constexpr (contains_offset_ptr((member_type*)nullptr))
         {
            auto ptr = reinterpret_cast<offset_ptr*>(out_ptr);
            return ptr->get<member_type>();
         }
         else
            return reinterpret_cast<flat_view<member_type>*>(out_ptr);
      }
   };

   /**
    *  A flat view of a flat pointer.
    */
   template <typename T>
   class flat<flat_ptr<T>>
   {
     public:
      auto get() { return reinterpret_cast<flat_view<T>*>(_data); }

     private:
      uint32_t _size = 0;
      char _data[];
   };

   template <>
   class flat<std::string>
   {
     public:
      uint32_t size() const { return _size; }
      const char* c_str() const { return _size ? _data : (const char*)this; }
      const char* data() const { return _size ? _data : nullptr; }
      char* data() { return _size ? _data : nullptr; }

      operator std::string_view() const { return std::string_view(_data, _size); }

      template <typename S>
      friend S& operator<<(S& stream, const flat<std::string>& str)
      {
         return stream << str.c_str();
      }

     private:
      uint32_t _size = 0;
      char _data[];
   };

   template <typename... Ts>
   class flat<std::variant<Ts...>>
   {
     public:
      uint64_t type = 0;
      uint32_t flat_data = 0;
      offset_ptr offset_data;

      static void assert_sizes()
      {
         static_assert(flat_variant_size == sizeof(flat));
         static_assert(flat_variant_data_size == sizeof(flat_data) + sizeof(offset_data));
         static_assert(std::is_trivially_copyable<flat>());
      }

      int64_t index_from_type() const { return get_index_from_type<Ts...>(); }

      void init_variant(std::variant<Ts...>& v) { _init_variant<Ts...>(v); }

      template <typename Visitor>
      void visit(Visitor&& v)
      {
         _visit_variant<Visitor, Ts...>(std::forward<Visitor>(v));
      }

     private:
      template <typename First, typename... Rest>
      int64_t get_index_from_type() const
      {
         if constexpr (sizeof...(Rest) == 0)
         {
            return get_type_hashname<First>() != type;
         }
         else
         {
            if (get_type_hashname<First>() == type)
               return 0;
            else
               return 1 + get_index_from_type<Ts...>();
         }
      }

      template <typename First, typename... Rest>
      void _init_variant(std::variant<Ts...>& v) const
      {
         if (get_type_hashname<First>() == type)
            v = First();
         else if constexpr (sizeof...(Rest) > 0)
         {
            _init_variant<Rest...>(v);
         }
      }
      template <typename Visitor, typename First, typename... Rest>
      void _visit_variant(Visitor&& v) const
      {
         if (get_type_hashname<First>() == type)
         {
            if constexpr (!contains_offset_ptr((First*)nullptr) &&
                          flatpack_size<First>() <= flat_variant_data_size)
            {
               v(*((const flat_view<First>*)&flat_data));
            }
            else
            {
               v(*((const flat_view<First>*)(((char*)(&offset_data)) + offset_data.offset)));
            }
         }
         else if constexpr (sizeof...(Rest) > 0)
         {
            _visit_variant<Visitor, Rest...>(std::forward<Visitor>(v));
         }
      }
   };

   /// T == value of the array elements
   template <typename T>
   class flat<std::vector<T>>
   {
     public:
      auto& operator[](uint32_t index)
      {
         eosio::check(index < _size, convert_stream_error(eosio::stream_error::overrun));

         /** in this case the data is a series of offset_ptr<> */
         if constexpr (std::is_same<T, std::string>())
         {
            auto ptr_array = reinterpret_cast<offset_ptr*>(_data);
            return *ptr_array[index].get<std::string>();
         }
         else if constexpr (contains_offset_ptr((T*)nullptr))
         {
            auto ptr_array = reinterpret_cast<offset_ptr*>(_data);
            // !!!
            return *reinterpret_cast<flat_view<T>*>(ptr_array[index].get<std::vector<T>>());
         }
         else if constexpr (eosio::reflection::has_for_each_field_v<T>)
         {  /// the data is a series of packed T
            const auto offset = index * flatpack_size<T>();
            return *reinterpret_cast<flat_view<T>*>(&_data[offset]);
         }
         else if constexpr (std::is_integral_v<T> || std::is_floating_point_v<T>)
         {
            auto T_array = reinterpret_cast<T*>(_data);
            return T_array[index];
         }
         else
         {
            T::is_not_a_known_flat_type;
         }
      }

      uint32_t size() const { return _size; }

     private:
      uint32_t _size = 0;
      char _data[];
   };

#if 0
// TODO
   template <typename T, typename InputStream>
   void flatcheck(InputStream& stream)
   {
      if constexpr (is_flat_ptr<T>())
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         stream.skip(size);
      }
      else if constexpr (is_std_variant<T>())
      {
         flat<T>::assert_sizes();
         flat<T> fv;
         stream.read(&fv, sizeof(fv));

         T temp;  /// this could do memory allocation for certain types... but hopefully won't,
                  /// this is used to do std::visit in the next line... in theory we could do
                  /// a dispatcher that only deals in types and not values.
         fv.init_variant(temp);
         std::visit(
             [&](auto& iv) {
                using item_type = eosio::remove_cvref_t<decltype(iv)>;
                if constexpr (contains_offset_ptr((item_type*)nullptr))
                {
                   /// the stream.pos is at the END of reading the variant, which
                   /// should be the same as the end of flat<variant>::offset_data
                   InputStream in(stream.pos + fv.offset_data.offset - sizeof(offset_ptr),
                                  stream.end);
                   flatunpack(iv, in);
                }
                else if constexpr (flatpack_size<item_type>() <= flat_variant_data_size)
                {
                }
                else
                {
                   InputStream in(stream.pos + fv.offset_data.offset - sizeof(offset_ptr),
                                  stream.end);
                   flatunpack(iv, in);
                }
             },
             temp);
         /// maybe deref pointer..
      }
      else if constexpr (std::is_same_v<T, std::string>)
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         stream.skip(size);
      }
      else if constexpr (eosio::is_std_vector<T>())
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         if constexpr (contains_offset_ptr((typename eosio::is_std_vector<T>::value_type*)nullptr))
         {
            auto start = stream.pos;
            stream.skip(size * sizeof(offset_ptr));

            offset_ptr* ptr = (offset_ptr*)(start);
            for (uint32_t i = 0; i < size; ++i)
            {
               InputStream in(((char*)ptr) + ptr->offset, stream.end);
               flatcheck<typename T::value_type>(in);
            }
         }
         else
         {
            stream.skip(size * flatpack_size<typename T::value_type>());
         }
      }
      else if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         if constexpr (contains_offset_ptr((T*)nullptr))
         {
            reflect<T>::for_each([&](const meta& ref, const auto& mptr) {
               using member_type = decltype(result_of_member(mptr));

               if constexpr (contains_offset_ptr((member_type*)nullptr))
               {
                  offset_ptr ptr;
                  stream.read(&ptr, sizeof(ptr));

                  InputStream substream(stream.pos + ptr.offset - sizeof(ptr), stream.end);
                  flatcheck<member_type>(substream);
               }
               else
               {
                  stream.skip(flatpack_size<member_type>());
               }
            });
         }
         else
         {
            stream.skip(flatpack_size<typename T::value_type>());
         }
      }
      else if constexpr (std::is_integral<T>||std::is_floating_point<T>)
      {
         stream.skip(sizeof(T));
      }
      else
      {
         T::is_not_defined;
      }
   }
#endif

#if 0
// TODO
   template <typename T, typename S>
   void flatunpack(T& v, S& stream)
   {
      if constexpr (is_flat_ptr<T>())
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         v.reset(size);
         stream.read(v.data(), size);
      }
      else if constexpr (is_std_variant<T>())
      {
         flat<T>::assert_sizes();
         flat<T> fv;
         stream.read(&fv, sizeof(fv));
         fv.init_variant(v);
         std::visit(
             [&](auto& iv) {
                using item_type = eosio::remove_cvref_t<decltype(iv)>;
                if constexpr (contains_offset_ptr((item_type*)nullptr)
                {
                   /// the stream.pos is at the END of reading the variant, which
                   /// should be the same as the end of flat<variant>::offset_data
                   input_stream in(stream.pos + fv.offset_data.offset - sizeof(offset_ptr),
                                   stream.end);
                   flatunpack(iv, in);
                }
                else if constexpr (flatpack_size<item_type>() <= flat_variant_data_size)
                {
                   input_stream st((const char*)&fv.flat_data, flat_variant_data_size);
                   flatunpack(iv, st);
                }
                else
                {
                   input_stream in(stream.pos + fv.offset_data.offset - sizeof(offset_ptr),
                                   stream.end);
                   flatunpack(iv, in);
                }
             },
             v);
      }
      else if constexpr (std::is_same_v<T, std::string>)
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         v.resize(size);
         stream.read(v.data(), size);
         stream.skip(1);  // null
      }
      else if constexpr (eosio::is_std_vector<T>())
      {
         uint32_t size;
         stream.read(&size, sizeof(size));
         v.resize(size);

         if constexpr (contains_offset_ptr((typename eosio::is_std_vector<T>>::value_type*)nullptr))
         {
            for (auto& item : v)
            {
               offset_ptr ptr;
               stream.read(&ptr, sizeof(ptr));

               /// TODO: we don't know the size of the buffer here...is it safe?
               input_stream in(stream.pos + ptr.offset - sizeof(ptr), stream.end);
               flatunpack(item, in);
            }
         }
         else
         {
            for (auto& item : v)
            {
               flatunpack(item, stream);
            }
         }
      }
      else if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         reflect<T>::for_each([&](const meta& ref, const auto& mptr) {
            auto& member = v.*mptr;
            using member_type = decltype(result_of_member(mptr));

            if constexpr (contains_offset_ptr((member_type*)nullptr))
            {
               offset_ptr ptr;
               stream.read(&ptr, sizeof(ptr));

               input_stream substream(stream.pos + ptr.offset - sizeof(ptr), stream.end);
               flatunpack(member, substream);
            }
            else
            {
               flatunpack(member, stream);
            }
         });
      }
      else if constexpr (std::is_integral<T>||std::is_floating_point<T>)
      {
         stream.read((char*)&v, sizeof(v));
      }
      else
      {
         T::is_not_defined;
      }
   }
#endif

   template <typename T, typename S>
   uint32_t flatpack(const T& v, S& stream)
   {
      if constexpr (is_flat_ptr<T>())
      {
         uint32_t size = v.size();
         stream.write(&size, sizeof(size));
         if (size)
            stream.write(v.data(), v.size());
         return sizeof(size) + size;
      }
      else if constexpr (eosio::is_std_variant<T>())
      {
         uint32_t alloc_pos = flatpack_size<T>();
         std::visit(
             [&](const auto& iv) {
                using item_type = eosio::remove_cvref_t<decltype(iv)>;
                flat<T>::assert_sizes();
                flat<T> fv;
                fv.type = get_type_hashname<item_type>();
                if constexpr (!contains_offset_ptr((item_type*)nullptr) &&
                              flatpack_size<item_type>() <= flat_variant_data_size)
                {
                   eosio::fixed_buf_stream st((char*)&fv.flat_data, flat_variant_data_size);
                   flatpack(iv, st);
                   stream.rite(&fv, sizeof(fv));
                }
                else
                {
                   fv.offset_data.offset = sizeof(fv.offset_data);
                   eosio::size_stream size_str;
                   flatpack(iv, size_str);
                   alloc_pos += size_str.size;

                   stream.write(&fv, sizeof(fv));

                   if constexpr (std::is_same_v<eosio::size_stream, S>)
                   {
                      stream.skip(size_str.size);  /// we already calculated this above
                   }
                   else
                   {
                      /// now pack the member into the allocated spot
                      eosio::fixed_buf_stream substream(
                          stream.pos + fv.offset_data.offset - sizeof(fv.offset_data),
                          size_str.size);
                      eosio::check(substream.end <= stream.end,
                                   convert_stream_error(eosio::stream_error::overrun));
                      flatpack(iv, substream);
                   }
                }
             },
             v);
         return alloc_pos;
      }
      else if constexpr (std::is_same_v<std::string, T>)
      {
         uint32_t size = v.size();
         stream.write(&size, sizeof(size));
         if (size)
         {
            stream.write(v.data(), v.size());
            stream.write("\0", 1);  /// null term
            return sizeof(size) + size + 1;
         }
         else
            return sizeof(size);
      }
      else if constexpr (eosio::is_std_vector<T>())
      {
         if constexpr (contains_offset_ptr((typename T::value_type*)nullptr))
         {
            uint32_t size = v.size();
            stream.write(&size, sizeof(size));
            uint32_t cur_pos = sizeof(size);
            uint32_t alloc_pos = sizeof(size) + size * sizeof(offset_ptr);

            for (const auto& member : v)
            {
               if constexpr (std::is_same_v<std::string, typename T::value_type> ||
                             eosio::is_std_vector<typename T::value_type>())
               {
                  if (member.size() == 0)
                  {
                     offset_ptr ptr = {.offset = 0};
                     stream.write(&ptr, sizeof(ptr));
                     cur_pos += sizeof(ptr);
                     continue;
                  }
               }

               eosio::size_stream size_str;
               flatpack(member, size_str);

               offset_ptr ptr = {.offset = (alloc_pos - cur_pos)};
               stream.write(&ptr, sizeof(ptr));
               alloc_pos += size_str.size;
               cur_pos += sizeof(ptr);

               if constexpr (std::is_same_v<eosio::size_stream, S>)
               {
                  stream.skip(size_str.size);  /// we already calculated this above
               }
               else
               {
                  /// now pack the member into the allocated spot
                  eosio::fixed_buf_stream substream(stream.pos + ptr.offset - sizeof(ptr),
                                                    size_str.size);  // ptr.size );
                  eosio::check(substream.end <= stream.end,
                               convert_stream_error(eosio::stream_error::overrun));
                  flatpack(member, substream);
               }
            }
            return alloc_pos;
         }
         else
         {
            //  std::cout << "vector type, T, is flat types:  " <<
            //  boost::core::demangle(typeid(typename T::value_type).name()) <<"\n";
            uint32_t size = v.size();
            stream.write(&size, sizeof(size));
            uint32_t cur_pos = sizeof(size);
            for (const auto& item : v)
               cur_pos += flatpack(item, stream);
            return cur_pos;
         }
      }
      else if constexpr (eosio::reflection::has_for_each_field_v<T>)
      {
         uint32_t cur_pos = 0;
         uint32_t alloc_pos = flatpack_size<T>();
         eosio::for_each_field(v, [&](const auto& member) {
            using member_type = eosio::remove_cvref_t<decltype(member)>;
            if constexpr (contains_offset_ptr((member_type*)nullptr))
            {
               if constexpr (std::is_same_v<std::string, member_type> ||
                             eosio::is_std_vector<member_type>())
               {
                  if (member.size() == 0)
                  {
                     offset_ptr ptr = {.offset = 0};
                     stream.write(&ptr, sizeof(ptr));
                     cur_pos += sizeof(ptr);
                     return;
                  }
               }

               eosio::size_stream size_str;
               flatpack(member, size_str);

               offset_ptr ptr = {.offset = alloc_pos - cur_pos};
               eosio::check(alloc_pos > cur_pos > 0, "flatbuf bug");

               alloc_pos += size_str.size;
               stream.write(&ptr, sizeof(ptr));
               cur_pos += sizeof(ptr);

               if constexpr (std::is_same_v<eosio::size_stream, S>)
               {
                  stream.skip(size_str.size);  /// we already calculated this above
               }
               else
               {
                  /// now pack the member into the allocated spot
                  eosio::fixed_buf_stream substream(stream.pos + ptr.offset - sizeof(ptr),
                                                    size_str.size);
                  eosio::check(substream.end <= stream.end,
                               convert_stream_error(eosio::stream_error::overrun));
                  flatpack(member, substream);
               }
            }
            else
            {
               cur_pos += flatpack(member, stream);
            }
         });
         return alloc_pos;
      }
      else if constexpr (std::is_integral_v<T> || std::is_floating_point_v<T>)
      {
         stream.write(&v, sizeof(v));
         return sizeof(v);
      }
      else
      {
         T::flatpack_is_not_defined;
         return 0;
      }
   }  // flatpack()

   /**
    * Behaves like a shared_ptr<T>, copies will all point to the same flat data array.
    */
   template <typename T>
   class flat_ptr
   {
     public:
      typedef T value_type;

      flat_ptr(const T& from)
      {
         eosio::size_stream ss;
         flatpack(from, ss);
         _size = ss.size;
         if (_size)
         {
            _data = std::shared_ptr<char>(new char[_size], [](char* c) { delete[] c; });
            eosio::fixed_buf_stream out(_data.get(), _size);
            flatpack(from, out);
         }
      }
      flat_ptr(){};
      operator bool() const { return _size; };

      auto operator->() { return reinterpret_cast<flat_view<T>*>(_data.get()); }
      auto operator->() const { return reinterpret_cast<const flat_view<T>*>(_data.get()); }
      const char* data() const { return _data.get(); }
      char* data() { return _data.get(); }
      size_t size() const { return _size; }

      void reset(size_t s = 0)
      {
         _size = s;
         if (_size)
            _data = std::shared_ptr<char>(new char[_size], [](char* c) { delete[] c; });
         else
            _data.reset();
      }

      operator T() const
      {
         T tmp;
         eosio::input_stream in(_data.get(), _size);
         flatunpack(tmp, in);
         return tmp;
      }

     private:
      std::shared_ptr<char> _data;
      size_t _size = 0;
   };

}  // namespace clio
