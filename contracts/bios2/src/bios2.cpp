#include <bios2/bios2.hpp>
#include <eosio/abi_generator.hpp>

namespace bios2
{
   void bios_contract::setabi(eosio::name account, const eosio::bytes& abi)
   {
      abi_hash_table table(get_self(), get_self().value);
      auto itr = table.find(account.value);
      if (itr == table.end())
      {
         table.emplace(account, [&](auto& row) {
            row.owner = account;
            row.hash = eosio::sha256(const_cast<char*>(abi.data.data()), abi.data.size());
         });
      }
      else
      {
         table.modify(itr, eosio::same_payer, [&](auto& row) {
            row.hash = eosio::sha256(const_cast<char*>(abi.data.data()), abi.data.size());
         });
      }
   }

   void bios_contract::setpriv(eosio::name account, bool is_priv)
   {
      require_auth(get_self());
      set_privileged(account, is_priv);
   }

   void bios_contract::setalimits(eosio::name account,
                                  int64_t ram_bytes,
                                  int64_t net_weight,
                                  int64_t cpu_weight)
   {
      require_auth(get_self());
      set_resource_limits(account, ram_bytes, net_weight, cpu_weight);
   }

   void bios_contract::setprods(const std::vector<eosio::producer_authority>& schedule)
   {
      require_auth(get_self());
      set_proposed_producers(schedule);
   }

   void bios_contract::setparams(const eosio::blockchain_parameters& params)
   {
      require_auth(get_self());
      set_blockchain_parameters(params);
   }

   void bios_contract::reqauth(eosio::name from) { require_auth(from); }

   void bios_contract::activate(const eosio::checksum256& feature_digest)
   {
      require_auth(get_self());
      preactivate_feature(feature_digest);
   }

   void bios_contract::reqactivated(const eosio::checksum256& feature_digest)
   {
      eosio::check(eosio::is_feature_activated(feature_digest),
                   "protocol feature is not activated");
   }
}  // namespace bios2

EOSIO_ACTION_DISPATCHER(bios2::actions)
EOSIO_ABIGEN(actions(bios2::actions), table("abihash"_n, bios2::abi_hash))
