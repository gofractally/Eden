#include <eden.hpp>
#include <members.hpp>

namespace eden
{
   void eden::notify_transfer(eosio::name from,
                              eosio::name to,
                              const eosio::asset& quantity,
                              std::string memo)
   {
      print_f("transfer from name: %\n", from);

      eosio::check(to == get_self(), "only accepting transfers to us");
      eosio::check(quantity.symbol == default_token,
                   "token must be a valid " + default_token.to_string());
      eosio::check(get_first_receiver() == token_contract,
                   "token must be from the right token contract");

      members{get_self()}.deposit(from, quantity);
   }
}  // namespace eden
