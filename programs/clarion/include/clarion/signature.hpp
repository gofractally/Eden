#pragma once

#include <algorithm>
#include <clarion/sha256.hpp>
#include <vector>

namespace clarion
{
   enum class signature_kind : uint32_t
   {
      ecdsa_secp256r1_sha256 = 0x403,
   };

   struct signature
   {
      signature_kind kind;
      std::vector<unsigned char> data;
      friend auto operator<=>(const signature&, const signature&) = default;
   };

   struct signing_private_key
   {
      virtual ~signing_private_key() {}
      virtual signature_kind kind() const = 0;
      virtual signature sign(const void* data, std::size_t size) const = 0;
   };

   struct ecdsa_secp256r1_sha256_private_key : signing_private_key
   {
      signature_kind kind() const { return signature_kind::ecdsa_secp256r1_sha256; }
      signature sign(const void* data, std::size_t size) const
      {
         signature result;
         result.kind = signature_kind::ecdsa_secp256r1_sha256;
         auto hash = sha256()(data, size);
         result.data.reserve(64);
         result.data.insert(result.data.end(), hash.begin(), hash.end());
         result.data.insert(result.data.end(), key_data, key_data + 32);
         return result;
      }
      unsigned char key_data[32];
   };

   struct signing_public_key
   {
      signature_kind kind;
      std::vector<unsigned char> data;
      friend auto operator<=>(const signing_public_key&, const signing_public_key&) = default;
   };

   bool verify(const signing_public_key& key,
               const signature& sig,
               const char* data,
               std::size_t size)
   {
      if (key.kind != sig.kind)
         return false;
      switch (key.kind)
      {
         case signature_kind::ecdsa_secp256r1_sha256:
         {
            auto hash = sha256()(data, size);
            return key.data.size() == 32 && sig.data.size() == 64 &&
                   std::equal(sig.data.begin(), sig.data.begin() + 32, hash.begin()) &&
                   std::equal(sig.data.begin() + 32, sig.data.end(), key.data.begin());
         }
      }
      return false;
   }
}  // namespace clarion
