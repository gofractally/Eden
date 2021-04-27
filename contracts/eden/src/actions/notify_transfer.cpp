#include <accounts.hpp>
#include <eden.hpp>

namespace eden
{
   void eden::notify_transfer(eosio::name from,
                              eosio::name to,
                              const eosio::asset& quantity,
                              std::string memo)
   {
      if (to != get_self())
         return;

      globals globals{get_self()};
      globals.check_active();
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());

      accounts{get_self()}.add_balance(from, quantity);
   }
}  // namespace eden
