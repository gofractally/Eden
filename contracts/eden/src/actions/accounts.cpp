#include <accounts.hpp>
#include <eden.hpp>
#include <token/token.hpp>

namespace eden
{
   static bool is_possible_deposit_account(eosio::name account)
   {
      constexpr auto eosio_prefix = "eosio"_n;
      constexpr auto eosio_mask = 0xFFFFFFFC00000000;
      return account != atomic_market_account && account != atomic_assets_account &&
             (account.value & eosio_mask) != eosio_prefix.value;
   }

   void eden::notify_transfer(eosio::name from,
                              eosio::name to,
                              const eosio::asset& quantity,
                              std::string memo)
   {
      if (to != get_self() || !is_possible_deposit_account(from))
         return;

      globals globals{get_self()};
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());

      accounts{get_self()}.add_balance(from, quantity);
   }

   void eden::withdraw(eosio::name owner, const eosio::asset& quantity)
   {
      require_auth(owner);

      globals globals{get_self()};
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());

      accounts{get_self()}.sub_balance(owner, quantity);
      token::actions::transfer{token_contract, get_self()}.send(  //
          get_self(), owner, quantity, "withdraw");
   }
}  // namespace eden
