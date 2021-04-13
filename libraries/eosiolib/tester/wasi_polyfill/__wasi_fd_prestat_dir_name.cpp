#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_fd_prestat_dir_name(__wasi_fd_t fd,
                                                     uint8_t* path,
                                                     __wasi_size_t path_len)
    __attribute__((__import_module__("wasi_snapshot_preview1"),
                   __import_name__("fd_prestat_dir_name")))
{
   [[clang::import_name("prints")]] void prints(const char*);
   [[clang::import_name("tester_abort"), noreturn]] void tester_abort();
   prints("__wasi_fd_prestat_dir_name not implemented");
   tester_abort();
}
