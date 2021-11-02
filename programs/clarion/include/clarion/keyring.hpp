#pragma once

#include <clarion/signature.hpp>
#include <map>
#include <memory>
#include <random>

namespace clarion
{
   struct keyring
   {
      std::pair<signing_public_key, signing_private_key*> generate_signing_key(
          signature_kind key_type)
      {
         switch (key_type)
         {
            case signature_kind::ecdsa_secp256r1_sha256:
            {
               auto priv = std::make_unique<ecdsa_secp256r1_sha256_private_key>();
               for (int i = 0; i < 32 / 8; ++i)
               {
                  auto value = rng();
                  for (int j = 0; j < 8; ++j)
                  {
                     priv->key_data[i * 8 + j] = (value & 0xFF);
                     value >>= 8;
                  }
               }
               signing_public_key pub{
                   signature_kind::ecdsa_secp256r1_sha256,
                   {&priv->key_data[0], &priv->key_data[0] + sizeof(priv->key_data)}};
               auto raw_priv = priv.get();
               cached_keys.insert({pub, std::move(priv)});
               return {std::move(pub), raw_priv};
            }
         }
         throw std::invalid_argument("unknown");
      }
      const signing_private_key* find_private_key(const signing_public_key& pub) const
      {
         auto pos = cached_keys.find(pub);
         if (pos != cached_keys.end())
         {
            return pos->second.get();
         }
         else
         {
            return nullptr;
         }
      }
      static inline unsigned counter = 0;
      keyring() : rng(counter++) {}
      std::mt19937_64 rng;
      std::map<signing_public_key, std::shared_ptr<signing_private_key>> cached_keys;
   };
}  // namespace clarion
