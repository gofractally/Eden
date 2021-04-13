#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_environ_get(uint8_t** environ, uint8_t* environ_buf)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("environ_get")))
{
   [[clang::import_name("prints")]] void prints(const char*);
   [[clang::import_name("tester_abort"), noreturn]] void tester_abort();
   prints("__wasi_environ_get not implemented");
   tester_abort();
}
