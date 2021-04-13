#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_path_open(__wasi_fd_t fd,
                                           __wasi_lookupflags_t dirflags,
                                           const char* path,
                                           size_t path_len,
                                           __wasi_oflags_t oflags,
                                           __wasi_rights_t fs_rights_base,
                                           __wasi_rights_t fs_rights_inherting,
                                           __wasi_fdflags_t fdflags,
                                           __wasi_fd_t* opened_fd)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("path_open")))
{
   [[clang::import_name("prints")]] void prints(const char*);
   [[clang::import_name("tester_abort"), noreturn]] void tester_abort();
   prints("__wasi_path_open not implemented");
   tester_abort();
}
