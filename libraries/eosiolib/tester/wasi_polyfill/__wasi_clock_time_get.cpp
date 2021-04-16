#include <wasi/api.h>

extern "C" __wasi_errno_t __wasi_clock_time_get(__wasi_clockid_t id,
                                                __wasi_timestamp_t precision,
                                                __wasi_timestamp_t* time)
    __attribute__((__import_module__("wasi_snapshot_preview1"), __import_name__("clock_time_get")))
{
   [[clang::import_name("tester_clock_time_get")]] uint16_t tester_clock_time_get(
       uint32_t id, uint64_t precision, uint64_t * time);
   return tester_clock_time_get(id, precision, time);
}
