#include <wasi/api.h>

#include <stdio.h>

extern "C" __wasi_errno_t __wasi_fd_fdstat_set_flags(__wasi_fd_t fd, __wasi_fdflags_t flags)
    __attribute__((__import_module__("wasi_snapshot_preview1"),
                   __import_name__("fd_fdstat_set_flags")))
{
   // TODO
   return 0;
}
