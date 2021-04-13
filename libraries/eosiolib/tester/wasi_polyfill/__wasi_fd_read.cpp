#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_fd_read(__wasi_fd_t fd,
                                         const __wasi_iovec_t* iovs,
                                         size_t iovs_len,
                                         __wasi_size_t* nread)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("fd_read")))
{
   [[clang::import_name("prints")]] void prints(const char*);
   [[clang::import_name("tester_abort"), noreturn]] void tester_abort();
   prints("__wasi_fd_read not implemented");
   tester_abort();
}
