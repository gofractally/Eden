#pragma once

namespace clarion
{
   enum class encryption_kind : std::uint32_t
   {
      ecies_secp256r1_hkdf_sha256_aes128_gcm,
      ecdh_secp256r1_hkdf_sha256_aeskw
   };

   struct encrypted_data
   {
      encryption_kind kind;
      std::vector<unsigned char> data;
   };

   struct encryption_public_key
   {
      encryption_kind kind;
      std::vector<unsigned char> data;
   };

   encrypted_data encrypt(const encryption_public_key& key, void* data, std::size_t size)
   {
      return encrypted_data{key.kind,
                            std::vector((unsigned char*)data, (unsigned char*)data + size)};
   }

   struct encryption_private_key
   {
      virtual ~encryption_private_key() {}
      virtual encryption_kind kind() const = 0;
      virtual std::vector<unsigned char> decrypt(const encrypted_data&) const = 0;
   };
}  // namespace clarion
