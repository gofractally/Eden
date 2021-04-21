#include <eden.hpp>
#include <inductions.hpp>
#include <members.hpp>

namespace eden
{
   void eden::genesis()
   {
      require_auth(get_self());

      members members{get_self()};
      inductions inductions{get_self()};

      members.clear_all();
      inductions.clear_all();

      auto inviter = get_self();

      for (int i = 0; i < genesis_pool.size(); i++)
      {
         auto induction_id = i + 1;
         const auto& invitee = genesis_pool[i];
         auto total_endorsements = genesis_pool.size() - 1;

         members.create(invitee);
         inductions.create_induction(induction_id, get_self(), genesis_pool[i], total_endorsements);

         for (const auto& endorser : genesis_pool)
         {
            if (endorser != invitee)
            {
               inductions.create_endorsement(inviter, invitee, endorser, induction_id);
            }
         }
      }
   }

}  // namespace eden
