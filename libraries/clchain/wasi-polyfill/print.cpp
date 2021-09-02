#include <eosio/chain_conversions.hpp>

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

extern "C" void printn(uint64_t n)
{
   std::string s = eosio::name_to_string(n);
   prints_l(s.data(), s.size());
}

extern "C" void printui(uint64_t value)
{
   char s[21];
   char* ch = s;
   do
   {
      *ch++ = '0' + (value % 10);
      value /= 10;
   } while (value);
   std::reverse(s, ch);
   prints_l(s, ch - s);
}

extern "C" void printi(int64_t value)
{
   if (value < 0)
   {
      prints("-");
      printui(-value);
   }
   else
      printui(value);
}
