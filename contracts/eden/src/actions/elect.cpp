#include <eden.hpp>
#include <elections.hpp>

namespace eden
{
   void eden::electseed(const eosio::bytes& btc_header)
   {
      elections elections{get_self()};
      elections.seed(btc_header);
   }

   void eden::electinit(const eosio::checksum256& seed)
   {
      require_auth(get_self());
      elections elections(get_self());
      elections.start_election(seed);
   }

   void eden::electprepare(uint32_t max_steps)
   {
      elections elections(get_self());
      eosio::check(elections.prepare_election(max_steps) != max_steps, "Nothing to do");
   }

   void eden::electvote(uint8_t round, eosio::name voter, eosio::name candidate)
   {
      eosio::require_auth(voter);
      elections elections(get_self());
      elections.vote(round, voter, candidate);
   }

   void eden::electprocess(uint32_t max_steps)
   {
      elections elections(get_self());
      eosio::check(elections.finish_round(max_steps) != max_steps, "Nothing to do");
   }

}  // namespace eden
