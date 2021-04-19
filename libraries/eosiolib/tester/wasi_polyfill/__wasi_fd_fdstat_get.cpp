#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_fd_fdstat_get(__wasi_fd_t fd, __wasi_fdstat_t* stat)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("fd_fdstat_get")))
{
   [[clang::import_name("tester_fdstat_get")]] uint32_t tester_fdstat_get(
       int32_t fd, uint8_t & fs_filetype, uint16_t & fs_flags, uint64_t & fs_rights_base,
       uint64_t & fs_rights_inheriting);
   return tester_fdstat_get(fd, stat->fs_filetype, stat->fs_flags, stat->fs_rights_base,
                            stat->fs_rights_inheriting);
}
