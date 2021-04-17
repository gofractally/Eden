#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_fd_prestat_get(__wasi_fd_t fd, __wasi_prestat_t* buf)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("fd_prestat_get")))
{
   // root dir
   if (fd == 3)
   {
      buf->tag = __WASI_PREOPENTYPE_DIR;
      buf->u.dir = {
          1  // strlen("/")
      };
      return 0;
   }
   return __WASI_ERRNO_BADF;
}
