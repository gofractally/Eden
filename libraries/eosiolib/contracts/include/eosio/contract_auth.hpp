#pragma once

#include <eosio/action.hpp>
#include <eosio/crypto.hpp>
#include <eosio/varint.hpp>

namespace eosio
{
   // No authorization provided
   struct no_auth
   {
   };
   EOSIO_REFLECT(no_auth)

   // Case 1: eosio account. run() does a require_auth(eosio_account).
   // * contract:          ""
   // * contract_account:  ""
   // * eosio_account:     the account
   //
   // Case 2: contract-defined account. run() does a require_auth(eosio_account), verifies
   //         that eosio_account is associated with contract_account, verifies the recovered
   //         public key is registered for the account, and checks the sequence number. run()
   //         may delegate everything except the require_auth to another contract.
   // * contract:          the contract defining the account space
   // * contract_account:  the account
   // * eosio_account:     eosio account associated with contract_account.
   struct account_auth
   {
      eosio::name contract;
      eosio::name contract_account;
      eosio::name eosio_account;
   };
   EOSIO_REFLECT(account_auth, contract, contract_account, eosio_account)

   // * signature:   covers sha256(contract, account, sequence, verbs)
   // * contract:    the contract defining the account space, or "" if an eosio account
   // * account:     the contract account or eosio account
   // * sequence:    replay prevention
   struct signature_auth
   {
      eosio::signature signature;
      eosio::name contract;
      eosio::name account;
      eosio::varuint32 sequence;
   };
   EOSIO_REFLECT(signature_auth, signature, contract, account, sequence)

   using run_auth = std::variant<no_auth, account_auth, signature_auth>;

   enum class run_auth_type
   {
      no_auth,
      account_auth,
      signature_auth
   };

   // * contract:          the contract defining the account space, or ""
   // * contract_account:  the contract account, or ""
   // * eosio_account:     eosio account, or ""
   // * recovered_key:     public key recovered from signature_auth
   // * sequence:          replay prevention
   struct recovered_auth
   {
      run_auth_type type = {run_auth_type::no_auth};
      eosio::name contract = {};
      eosio::name contract_account = {};
      eosio::name eosio_account = {};
      eosio::public_key recovered_key = {};
      eosio::varuint32 sequence = {};
   };

   // Recover authentication from the datastream. ds must have this format:
   //      run_auth, std::vector<*>
   //
   // * If run_auth is no_auth, then all fields of recovered_auth are default (empty)
   // * If run_auth is account_auth, then recover_auth() runs require_auth(eosio_account) and
   //   copies the fields of account_auth.
   // * If run_auth is signature_auth, then recover_auth() recovers the public key from
   //   signature and copies the remaining fields from signature_auth.
   inline recovered_auth recover_auth(datastream<const char*>& ds)
   {
      recovered_auth result;
      eosio::varuint32 t;
      ds >> t;
      result.type = (run_auth_type)t.value;
      if (t.value == (int)run_auth_type::no_auth)
      {
      }
      else if (t.value == (int)run_auth_type::account_auth)
      {
         eosio::account_auth a;
         ds >> a;
         eosio::require_auth(a.eosio_account);
         result.contract = a.contract;
         result.contract_account = a.contract_account;
         result.eosio_account = a.eosio_account;
      }
      else if (t.value == (int)run_auth_type::signature_auth)
      {
         eosio::signature signature;
         eosio::name account;
         ds >> signature;
         auto digest = eosio::sha256(ds.pos(), ds.remaining());
         result.recovered_key = eosio::recover_key(digest, signature);
         ds >> result.contract;
         ds >> account;
         ds >> result.sequence;
         if (result.contract.value)
            result.contract_account = account;
         else
            result.eosio_account = account;
      }
      else
      {
         eosio::check(false, "unsupported auth type");
      }
      return result;
   }
}  // namespace eosio
