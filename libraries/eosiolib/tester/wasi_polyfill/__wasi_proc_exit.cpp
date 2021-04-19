#include <wasi/api.h>

extern "C" _Noreturn void __wasi_proc_exit(__wasi_exitcode_t code)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("proc_exit")))
{
   [[clang::import_name("eosio_exit"), noreturn]] void eosio_exit(int32_t code);
   eosio_exit(code);
}
