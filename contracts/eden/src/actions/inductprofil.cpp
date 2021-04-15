#include <eden.hpp>
#include <inductions.hpp>

namespace eden
{
   void eden::inductprofil(eosio::name inviter,
                           eosio::name invitee,
                           new_member_profile new_member_profile)
   {
      require_auth(invitee);
   }
}  // namespace eden
