#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_fd_close(__wasi_fd_t fd)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("fd_close")))
{
   [[clang::import_name("tester_close_file")]] uint32_t tester_close_file(int32_t fd);
   return tester_close_file(fd);
}
