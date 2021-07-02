#include <clchain/crypto.hpp>

#include <openssl/sha.h>

namespace clchain
{
   eosio::checksum256 sha256(const char* data, uint32_t length)
   {
      std::array<unsigned char, 256 / 8> result;
      SHA256((const unsigned char*)data, length, result.data());
      return result;
   }
}  // namespace clchain
