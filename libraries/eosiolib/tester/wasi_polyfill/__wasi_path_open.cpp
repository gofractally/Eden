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
   [[clang::import_name("tester_open_file")]] uint32_t tester_open_file(
       const char* path, size_t path_len, uint16_t oflags, uint64_t fs_rights_base,
       uint16_t fdflags, int* opened_fd);
   if (fd != 3)
      return __WASI_ERRNO_BADF;
   return tester_open_file(path, path_len, oflags, fs_rights_base, fdflags, opened_fd);
}
