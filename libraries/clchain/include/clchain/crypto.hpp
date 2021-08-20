#pragma once

#include <eosio/fixed_bytes.hpp>

namespace clchain
{
   eosio::checksum256 sha256(const char* data, uint32_t length);
}
