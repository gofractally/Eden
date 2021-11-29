#pragma once

#include <eosio/fixed_bytes.hpp>

namespace btb
{
   eosio::checksum256 sha256(const char* data, uint32_t length);
}
