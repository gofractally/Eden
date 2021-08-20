#include <stdint.h>
#include <string.h>

extern "C" void prints_l(const char* str, uint32_t len)
{
   [[clang::import_module("clchain"), clang::import_name("console")]] void import_console(
       const char*, uint32_t);
   import_console(str, len);
}

extern "C" void prints(const char* cstr)
{
   prints_l(cstr, strlen(cstr));
}
