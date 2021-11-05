#include <eden.hpp>

namespace eden
{
   void eden::runactions(const eosio::signature& sig,
                         eosio::name eden_account,
                         eosio::varuint32 sequence,
                         eosio::ignore<std::vector<action>> actions)
   {
      eosio::excluded_arg<auth_info> auth;
      auth.value.authorized_eden_account = eden_account;

      eosio::varuint32 num_actions;
      get_datastream() >> num_actions;
      eosio::check(num_actions.value > 0, "actions is empty");
      for (uint32_t i = 0; i < num_actions.value; ++i)
      {
         eosio::varuint32 index;
         get_datastream() >> index;
         eosio::check(actions::dispatch_auth(get_self(), index.value, auth, get_datastream()),
                      "unsupported action index");
      }
   }
}  // namespace eden
