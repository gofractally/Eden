#pragma once

#include <clarion/sync/message_types.hpp>
#include <cstdint>
#include <deque>
#include <utility>
#include <variant>

namespace clarion
{
   // A database is parameterized by
   // - The key type
   // - The value type
   // - A merkle tree structure over all possible keys
   // - A function for combining values with the same key
   // - A cryptographic hash function
   // - A function to determine whether a key/value pair is valid
   // - Dependencies on other databases. e.g. the identity blockchain of the owner

   // The combining function must be commutative, associative, and idempotent.

   // associativity guarantees that the system converges to a deterministic value
   // we only need it to converge to some value, determinism is nice to have, but
   // not essential.

   // f(a, b) = f(b, a)
   // f(a, a) = a
   // For every finite set of elements S, there exists a finite set T, such that
   // - S \subset T
   // - T is closed under f
   // There exists a partial ordering over the elements such that
   // if f(a,b) = c, then a \le c and b \le c

   // Possible combining functions:
   // - maximum (using any total ordering)
   // - set union

   // Possible key types
   // - sequence number (mostly contiguous integers starting at 0)
   // - hash (fixed-size integer with uniform distribution)
   // - octet-string (arbitrary data, no distribution requirements)
   // - singleton
   // Anything can be represented by an octet-string, but it may be
   // less efficient than a type-specific implementation.

   // Possible value types:
   // -
   // - Another database (combining function syncs data)

   // How do we represent the identity chain?
   // - key = channel id
   // - value = cryptographic suite + public key + block number + signatures
   // - combining function = set union of the values with the highest block number
   // - Validity function = signature by channel 0 key.

   // Required properties of the identity chain:
   // - "blocks" can be received out of order
   // - An attacker who has the key of an old block, cannot fool anyone who has the current block.
   // -
   //
   // - key = block number
   // - value = cryptographic suite/public key/signatures/hash of previous value
   // - blocks are pending until

   template <typename Merkle,
             typename Messages,
             typename KeyExtractor,
             typename MergeFun,
             typename LeafFun,
             typename VerifyFun>
   struct generic_sync
   {
      Merkle& merkle;
      Messages& messages;
      KeyExtractor key_extractor;
      MergeFun merge;
      LeafFun on_leaf;
      VerifyFun verify;
      using range_type = Merkle::range_type;
      using hash_type = decltype(std::declval<Merkle>().get(range_type{}));
      using data_type =
          std::decay_t<decltype(*std::declval<Messages>().get(std::declval<hash_type>()))>;
      using root_message = clarion::root_message<range_type, hash_type>;
      using node_message = clarion::node_message<range_type, hash_type>;
      using ack_message = clarion::ack_message<range_type>;
      using leaf_message = clarion::leaf_message<data_type>;
      std::deque<range_type> outbox;
      template <typename F>
      bool recv(const leaf_message& in, F&& out)
      {
         if (!verify(in.contents))
         {
            return false;
         }
         auto key = key_extractor(in.contents);
         auto old_hash = merkle.get(range_type{key});
         hash_type hash;
         if (old_hash != hash_type())
         {
            auto* old_value = messages.get(old_hash);
            assert(old_value);
            hash = messages.add(merge(*old_value, in.contents));
         }
         else
         {
            hash = messages.add(on_leaf(in.contents));
         }

         if (hash != old_hash)
         {
            merkle.set(key, hash);
            // notify all other active connections that are interested in this message

            // Ordering:
            // - Add to messages
            // - Add to merkle tree
            // - send notification
            //
            // Cases that need to be prevented:
            // - Message is broadcast before peer listener is set up, but is not in the merkle tree.
            //   Therefore, the message must be added to the merkle tree before broadcast.
            // - Multiple messages with the same key come arrive and one is lost.
         }
         if (old_hash != hash_type() && hash != old_hash)
         {
            auto msg = leaf_message{*messages.get(hash)};
            out(std::move(msg));
         }
         else
         {
            out(ack_message{range_type{key}});
         }
         return false;
      }
      template <typename F>
      void send(const range_type& r, F&& out)
      {
         // Assumes that every message in the merkle tree exists in the message storage.
         // Both the messages and the merkle tree may be updated asynchronously.
         if (auto msg = messages.get(merkle.get(r)))
         {
            out(leaf_message{*msg});
         }
         else
         {
            out(ack_message{r});
         }
      }
      bool has_pending() const { return !outbox.empty(); }
   };

}  // namespace clarion
