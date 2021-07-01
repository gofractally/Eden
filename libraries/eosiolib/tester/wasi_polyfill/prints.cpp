#include <stdint.h>
#include <string.h>

extern "C" void prints(const char* cstr)
{
   [[clang::import_name("prints_l")]] void prints_l(const char*, uint32_t);
   prints_l(cstr, strlen(cstr));
}
