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
      require_auth(induction.invitee);

      members{get_self()}.check_pending_member(induction.invitee);

      inductions.update_profile(induction, new_member_profile);
   }

   void eden::inductvideo(eosio::name account,
                          uint64_t id,
                          std::string video)
   {
      require_auth(account);
      inductions inductions{get_self()};
      auto induction = inductions.get_induction(id);
      eosio::check(inductions.is_endorser(id, account),
		   "Video can only be set by inviter or a witness");
      inductions.update_video(induction, video);
   }

   void eden::inductendorse(eosio::name account,
                            uint64_t id,
                            eosio::checksum256 induction_data_hash)
   {
      require_auth(account);
      inductions inductions{get_self()};
      const auto& induction = inductions.get_induction(id);
      eosio::check(inductions.is_endorser(id, account),
                   "Induction  can only be endorsed by inviter or a witness");
      inductions.endorse(induction, account, induction_data_hash);
   }

   void eden::inducted(eosio::name inductee)
   {
      eosio::require_auth(get_self());

      members members{get_self()};
      members.set_active(inductee);

      inductions inductions(get_self());
      const auto& induction = inductions.get_endorsed_induction(inductee);
      inductions.erase_induction(induction);
   }

}  // namespace eden
