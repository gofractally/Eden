#include <eden.hpp>
#include <inductions.hpp>
#include <members.hpp>

namespace eden
{
   void eden::inductinit(uint64_t id,
                         eosio::name inviter,
                         eosio::name invitee,
                         std::vector<eosio::name> witnesses)
   {
      require_auth(inviter);

      members members{get_self()};
      members.check_active_member(inviter);
      for (const auto& witness : witnesses)
      {
         members.check_active_member(witness);
      }
      members.check_pending_member(invitee);

      inductions{get_self()}.initialize_induction(id, inviter, invitee, witnesses);
   }

   void eden::inductprofil(uint64_t id, new_member_profile new_member_profile)
   {
      inductions inductions{get_self()};
      auto induction = inductions.get_induction(id);
      require_auth(induction.invitee());

      members{get_self()}.check_pending_member(induction.invitee());

      inductions.update_profile(induction, new_member_profile);
   }
}  // namespace eden
