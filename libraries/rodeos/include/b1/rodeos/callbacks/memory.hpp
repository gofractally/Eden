#pragma once

#include <b1/rodeos/callbacks/vm_types.hpp>

namespace b1::rodeos
{
   template <typename Derived>
   struct memory_callbacks
   {
      Derived& derived() { return static_cast<Derived&>(*this); }

      void* memcpy_impl(memcpy_params params) const
      {
         auto [dest, src, length] = params;
         if ((size_t)(std::abs((ptrdiff_t)(char*)dest - (ptrdiff_t)(const char*)src)) < length)
            throw std::runtime_error("memcpy can only accept non-aliasing pointers");
         return (char*)std::memcpy((char*)dest, (const char*)src, length);
      }

      void* memmove_impl(memcpy_params params) const
      {
         auto [dest, src, length] = params;
         return (char*)std::memmove((char*)dest, (const char*)src, length);
      }

      int32_t memcmp_impl(memcmp_params params) const
      {
         auto [dest, src, length] = params;
         int32_t ret = std::memcmp((const char*)dest, (const char*)src, length);
         return ret < 0 ? -1 : ret > 0 ? 1 : 0;
      }

      void* memset_impl(memset_params params) const
      {
         auto [dest, value, length] = params;
         return (char*)std::memset((char*)dest, value, length);
      }

      template <typename Rft>
      static void register_callbacks()
      {
         Rft::template add<&Derived::memcpy_impl>("env", "memcpy");
         Rft::template add<&Derived::memmove_impl>("env", "memmove");
         Rft::template add<&Derived::memcmp_impl>("env", "memcmp");
         Rft::template add<&Derived::memset_impl>("env", "memset");
      }
   };  // memory_callbacks

}  // namespace b1::rodeos
