#pragma once

#include <eosio/bytes.hpp>
#include <eosio/fixed_bytes.hpp>
#include <eosio/name.hpp>
#include <eosio/time.hpp>

namespace eden_chain
{
   struct action
   {
      uint64_t seq = 0;
      eosio::name firstReceiver;
      eosio::name receiver;
      eosio::name name;
      eosio::bytes hexData;
   };
   EOSIO_REFLECT(action, seq, firstReceiver, receiver, name, hexData)

   struct transaction
   {
      eosio::checksum256 id;
      std::vector<action> actions;
   };
   EOSIO_REFLECT(transaction, id, actions)

   struct eosio_block
   {
      uint32_t num = 0;
      eosio::checksum256 id;
      eosio::checksum256 previous;
      eosio::time_point timestamp;
      std::vector<transaction> transactions;
   };
   EOSIO_REFLECT(eosio_block, num, id, previous, timestamp, transactions)

   struct block
   {
      uint32_t num = 0;
      eosio::checksum256 previous;
      eosio_block eosio_block;
   };
   EOSIO_REFLECT(block, num, previous, eosio_block)

   struct block_with_id
   {
      block block;
      eosio::checksum256 id;
   };
   EOSIO_REFLECT(block_with_id, block, id)
}  // namespace eden_chain
