#pragma once

#include <algorithm>
#include <array>
#include <cstring>

#include <openssl/sha.h>

namespace clarion
{
   struct sha256
   {
      using result_type = std::array<unsigned char, 32>;
      // Hash a element.  Should never give a hash equal to result_type{},
      // because that is reserved to identify missing entries.  Cryptographic
      // hash functions provide zero-preimage resistance, so this is not
      // a real problem.
      result_type operator()(const void* data, std::size_t size) const
      {
         result_type result{};
         SHA256_CTX ctx;
         SHA256_Init(&ctx);
         SHA256_Update(&ctx, data, size);
         SHA256_Final(result.data(), &ctx);
         return result;
      }
      // Combines two hashes to get the parent merkle node.
      // If either parameter is 0, the result should equal be the other parameter
      result_type operator()(const result_type& left, const result_type& right) const
      {
         result_type result;
         std::transform(left.begin(), left.end(), right.begin(), result.begin(), std::bit_xor<>());
         return result;
      }
      result_type operator()(const std::array<result_type, 2>& args) const
      {
         return (*this)(args[0], args[1]);
      }
   };
}  // namespace clarion
