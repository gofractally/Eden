#pragma once

#include <algorithm>
#include <clarion/flat_merkle.hpp>
#include <clarion/keyring.hpp>
#include <clarion/signature.hpp>
#include <cstdint>
#include <map>
#include <vector>

namespace clarion
{
   enum class hash_kind : std::uint32_t
   {
      sha256
   };
   struct any_hash
   {
      hash_kind hash_type;
      std::vector<unsigned char> hash;
      friend auto operator<=>(const any_hash&, const any_hash&) = default;
   };
   struct identity
   {
      any_hash original_keyid;
      friend auto operator<=>(const identity&, const identity&) = default;
   };

   template <typename Hash>
   constexpr hash_kind hash_kind_of;

   template <>
   constexpr hash_kind hash_kind_of<sha256> = hash_kind::sha256;

   template <typename Hash, typename T>
   any_hash to_any_hash(const T& t)
   {
      return {hash_kind_of<Hash>, {t.begin(), t.end()}};
   }

   struct identity_block_signature
   {
      uint16_t sequence;
      signature sig;
      any_hash keyid;
      friend auto operator<=>(const identity_block_signature&,
                              const identity_block_signature&) = default;
   };

   struct identity_block
   {
      std::vector<unsigned char> previous_block;
      signing_public_key key;
      std::vector<signing_public_key> trusted_witnesses;
      uint64_t height;
      std::vector<identity_block_signature> signatures;
      friend bool operator==(const identity_block& lhs, const identity_block& rhs) = default;
   };

   // At height N, block A is better than block B, if
   // - the predecessor of A is better than the predecessor of B or
   // - A and B have the same previous block, and A has more signatures.  For this purpose, the
   //   primary key has a weight of recovery_threshold + 0.5.

   // A key type defines two functions:
   // - valid(signature, hash) -> bool
   // - compare(signature, signature) -> int
   //   - indicates which of two valid signatures is better
   //     The signatures must both be valid

   // If the difference exceeds some threshold, then the worse block will be
   // dropped silently.
   // You can always apply a manual override to follow a specific chain.
   // If you are a friend of the owner, this will sign the identity.

   // Three kinds of failures
   // - The owner is unable to sign with the key
   // - Someone other than the owner is able to sign with the key
   // - The owner signs something he shouldn't have
   //
   // The ultimate fallback is a hard reset and a new identity that has a clone of the old data.
   // This is always possible, but requires manual action from every subscriber.
   //

   // New approach:
   // - Every block signature has a sequence number, assigned by the signer.
   // - At each block height, we retain the block with the highest sequence number for each signer.
   // - This means that the number of blocks stored is at most the number of possible signers.
   // - Each node retains blocks that were signed at that node, even if they do not have the highest sequence number.

   // The correct identity block will be chosen as long as strictly more of your friends
   // sign it than sign the fradulent one.  (i.e. as long as you can convince all of your
   // friends of your identity and at least one friend is not deceived by the fake identity
   // you win).

   struct identity_block_group
   {
      // For each possible signer, we store one of the following:
      // - nothing
      // - an identity block signed by that identity
      // - proof that no signature by that identity should be considered valid for this block number.
      std::vector<identity_block> blocks;
      friend auto operator<=>(const identity_block_group&, const identity_block_group&) = default;
   };

   // hacky incomplete version: only used as input to the hash function
   inline std::vector<unsigned char> convert_to_bin(const identity_block_group& group)
   {
      std::vector<unsigned char> result;
      for (const auto& block : group.blocks)
      {
         result.insert(result.end(), block.key.data.begin(), block.key.data.end());
         result.insert(result.end(), block.previous_block.begin(), block.previous_block.end());
         for (const auto& [seq, sig, keyid] : block.signatures)
         {
            result.insert(result.end(), sig.data.begin(), sig.data.end());
         }
      }
      return result;
   }

   inline std::vector<unsigned char> block_id(const identity_block& block)
   {
      auto unsig = block;
      unsig.signatures.clear();
      auto bin = convert_to_bin({{unsig}});
      auto result = sha256()(bin.data(), bin.size());
      return {result.begin(), result.end()};
   }

   inline identity get_identity(const identity_block& block)
   {
      return {{hash_kind::sha256, block_id(block)}};
   }

   inline const identity_block& best_block(const identity_block_group& group)
   {
      return *std::max_element(group.blocks.begin(), group.blocks.end(),
                               [](const auto& lhs, const auto& rhs) {
                                  return lhs.signatures.size() < rhs.signatures.size();
                               });
   }

   template <typename It1, typename It2, typename Out, typename F, typename Comp>
   void merge(It1 begin1, It1 end1, It2 begin2, It2 end2, Out out, F f, Comp comp)
   {
      while (true)
      {
         if (begin1 == end1)
         {
            std::copy(begin2, end2, out);
            break;
         }
         else if (begin2 == end2)
         {
            std::copy(begin1, end1, out);
            break;
         }
         else if (comp(*begin1, *begin2))
         {
            *out++ = *begin1++;
         }
         else if (comp(*begin2, *begin1))
         {
            *out++ = *begin2++;
         }
         else
         {
            *out++ = f(*begin1++, *begin2++);
         }
      }
   }

   const identity_block_signature& best_signature(const identity_block_signature& lhs,
                                                  const identity_block_signature& rhs)
   {
      return std::max(lhs, rhs);
   }

   bool compare_signature_identities(const identity_block_signature& lhs,
                                     const identity_block_signature& rhs)
   {
      return lhs.keyid < rhs.keyid;
   }

   identity_block merge_signatures(const identity_block& lhs, const identity_block& rhs)
   {
      assert(lhs.previous_block == rhs.previous_block);
      assert(lhs.key == rhs.key);
      identity_block result{lhs.previous_block, lhs.key, lhs.trusted_witnesses, lhs.height};
      merge(lhs.signatures.begin(), lhs.signatures.end(), rhs.signatures.begin(),
            rhs.signatures.end(), std::back_inserter(result.signatures), best_signature,
            compare_signature_identities);
      return result;
   }

   bool compare_ids(const identity_block& lhs, const identity_block& rhs)
   {
      return std::tie(lhs.previous_block, lhs.key) < std::tie(rhs.previous_block, rhs.key);
   }

   identity_block_group merge(const identity_block_group& lhs, const identity_block_group& rhs)
   {
      // first combine all blocks with the same id, merging the signature sets
      // then prune unneeded blocks.
      // A block is needed iff it is has the best signature for at least one key
      identity_block_group result;
      merge(lhs.blocks.begin(), lhs.blocks.end(), rhs.blocks.begin(), rhs.blocks.end(),
            std::back_inserter(result.blocks), merge_signatures, compare_ids);
      std::map<any_hash, std::pair<std::size_t, identity_block_signature>> best_blocks;
      for (std::size_t i = 0; i < result.blocks.size(); ++i)
      {
         for (const auto& sig : result.blocks[i].signatures)
         {
            auto id = sig.keyid;
            auto pos = best_blocks.find(id);
            if (pos == best_blocks.end())
            {
               best_blocks.insert({id, {i, sig}});
            }
            else
            {
               if (pos->second.second < sig)
               {
                  pos->second = {i, sig};
               }
            }
         }
      }
      result.blocks.erase(
          std::remove_if(result.blocks.begin(), result.blocks.end(),
                         [&](auto& block) {
                            return std::find_if(block.signatures.begin(), block.signatures.end(),
                                                [&](auto& sig) {
                                                   return sig == best_blocks[sig.keyid].second;
                                                }) == block.signatures.end();
                         }),
          result.blocks.end());
      return result;
   }

   struct fork_database
   {
      using hash_type = sha256::result_type;
      // keyed by previous block
      // also need to track associated connections
      // a block is dropped if all associated connections are closed

      // returns the number of blocks switched
      const identity_block_group& add(const identity_block_group& group)
      {
         // This shouldn't be allowed, but I haven't decided where it is enforced
         //if(group.blocks.empty()) return 0;

         auto prev = group.blocks.front().previous_block;
         auto pos = blocks.find(prev);
         bool fork_switch;
         bool same_block;
         if (pos == blocks.end())
         {
            pos = blocks.insert({prev, group}).first;
            fork_switch = true;
            same_block = false;
         }
         else
         {
            auto old_best_block = block_id(best_block(pos->second));
            auto new_group = merge(pos->second, group);
            auto new_best_block = block_id(best_block(new_group));
            fork_switch = old_best_block != new_best_block;
            same_block = pos->second == new_group;
            pos->second = new_group;
         }
         const auto& result = pos->second;
         // if the previous block is the best block at that index, and the operation changed
         // the best block of this group, then run a fork switch.
         auto height = group.blocks.front().height;
         auto block = get_block_id_by_index(height - 1);
         if (block == prev && !same_block)
         {
            while (pos != blocks.end())
            {
               set_block(height, pos->second);
               prev = block_id(best_block(pos->second));
               pos = blocks.find(prev);
               ++height;
            }
            clear_blocks(height);
         }
         return result;
      }
      std::vector<unsigned char> get_block_id_by_index(std::uint64_t idx)
      {
         if (idx < best_chain.size())
         {
            return block_id(best_chain[idx]);
         }
         else
         {
            return {};
         }
      }
      identity_block get_block_by_index(std::uint64_t idx) { return best_chain[idx]; }
      const identity_block& head() const { return best_chain.back(); }
      const identity_block_group* get_group_by_index(std::uint64_t idx) const
      {
         if (idx < best_chain.size())
         {
            auto iter = blocks.find(best_chain[idx].previous_block);
            if (iter != blocks.end())
            {
               return &iter->second;
            }
         }
         return nullptr;
      }
      void set_block(uint64_t index, const identity_block_group& group)
      {
         auto serialized_group = convert_to_bin(group);
         merkle.set(index, sha256()(serialized_group.data(), serialized_group.size()));
         if (best_chain.size() <= index)
         {
            best_chain.resize(index + 1);
         }
         best_chain[index] = best_block(group);
      }
      void clear_blocks(uint64_t start_index)
      {
         for (; start_index <= merkle.high_sequence; ++start_index)
         {
            merkle.set(start_index, hash_type());
         }
         best_chain.resize(start_index);
      }
      flat_merkle<sha256, 4096> merkle;
      std::vector<identity_block> best_chain;
      std::map<std::vector<unsigned char>, identity_block_group> blocks;
   };

   identity_block update_key(keyring& keys,
                             const identity_block& previous,
                             signature_kind key_type,
                             const std::vector<identity>& friends)
   {
      // generate a key for each friend, and encrypt it with the public key
      auto [pub, priv] = keys.generate_signing_key(key_type);
      std::vector<signing_public_key> witnesses;
      for (const auto& f : friends)
      {
         auto [fpub, fpriv] = keys.generate_signing_key(key_type);
         witnesses.push_back(std::move(fpub));
      }
      identity_block result{block_id(previous), pub, witnesses, previous.height + 1};
      auto bin = convert_to_bin({{result}});
      const signing_private_key* key = keys.find_private_key(previous.key);
      result.signatures.push_back(identity_block_signature{
          0, key->sign(bin.data(), bin.size()), {hash_kind::sha256, result.previous_block}});
      return result;
   }

   identity_block new_identity(keyring& keys,
                               signature_kind key_type,
                               hash_kind hash_type,
                               std::size_t num_friends = 8)
   {
      // generate a key for each friend, and encrypt it with the public key
      auto [pub, priv] = keys.generate_signing_key(key_type);
      std::vector<signing_public_key> witnesses;
      for (std::size_t i = 0; i < num_friends; ++i)
      {
         auto [fpub, fpriv] = keys.generate_signing_key(key_type);
         witnesses.push_back(std::move(fpub));
      }
      identity_block result{{}, pub, witnesses, 0};
      auto bin = convert_to_bin({{result}});
      result.signatures.push_back(identity_block_signature{
          0, priv->sign(bin.data(), bin.size()), {hash_kind::sha256, block_id(result)}});
      return result;
   }
}  // namespace clarion
