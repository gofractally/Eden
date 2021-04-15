#include <inductions.hpp>

namespace eden
{
   void inductions::initialize_induction(uint64_t id,
                                         eosio::name inviter,
                                         eosio::name invitee,
                                         const std::vector<eosio::name>& witnesses)
   {
      check_new_induction(inviter, invitee);

      induction_tb.emplace(contract, [&](auto& row) {
         row.id = id;
         row.inviter = inviter;
         row.invitee = invitee;
         row.witnesses = witnesses;
         row.endorsements = {};
         row.created_at = eosio::current_block_time();
         row.video = "";
         row.new_member_profile = {};
      });
   }

   void inductions::check_new_induction(eosio::name inviter, eosio::name invitee) const
   {
      auto invitee_index = induction_tb.get_index<"byinvitee"_n>();

      auto invitee_key = combine_names(invitee, inviter);
      auto itr = invitee_index.find(invitee_key);

      eosio::check(itr == invitee_index.end(),
                   "induction for this invitation is already in progress");
   }
}  // namespace eden
