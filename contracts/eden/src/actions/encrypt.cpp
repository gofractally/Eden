#include <eden.hpp>
#include <members.hpp>

namespace eden
{
   void eden::setencpubkey(eosio::name member, const eosio::public_key& key)
   {
      eosio::require_auth(member);
      members members{get_self()};
      members.set_key(member, key);
   }
}  // namespace eden
