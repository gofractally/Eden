#pragma once

#include <stdint.h>

namespace polyfill
{
   [[noreturn, clang::import_module("clchain"), clang::import_name("abort_message")]] void
   abort_message(const char*, uint32_t);

   template <int size>
   [[noreturn]] inline void abort_message(const char (&msg)[size])
   {
      abort_message(msg, size - 1);
   }
}  // namespace polyfill
