#include <elections.hpp>
#include <members.hpp>

namespace eden
{
   const member& members::get_member(eosio::name account)
   {
      return member_tb.get(account.value, ("member " + account.to_string() + " not found").c_str());
   }

   void members::check_active_member(eosio::name account)
   {
      eosio::check(get_member(account).status() == member_status::active_member,
                   "inactive member " + account.to_string());
   }

   void members::check_pending_member(eosio::name account)
   {
      eosio::check(get_member(account).status() == member_status::pending_membership,
                   "member " + account.to_string() + " is not pending");
   }

   bool members::is_new_member(eosio::name account) const
   {
      auto itr = member_tb.find(account.value);
      return itr == member_tb.end();
   }

   void members::create(eosio::name account)
   {
      auto stats = std::get<member_stats_v0>(member_stats.get_or_default());
      ++stats.pending_members;
      eosio::check(stats.pending_members != 0, "Integer overflow");
      member_stats.set(stats, contract);
      member_tb.emplace(contract, [&](auto& row) {
         row.account() = account;
         row.status() = member_status::pending_membership;
         row.nft_template_id() = 0;
      });
   }

   member_table_type::const_iterator members::erase(member_table_type::const_iterator iter)
   {
      auto stats = std::get<member_stats_v0>(member_stats.get());
      switch (iter->status())
      {
         case member_status::pending_membership:
            eosio::check(stats.pending_members != 0, "Integer overflow");
            --stats.pending_members;
            break;
         case member_status::active_member:
            eosio::check(stats.active_members != 0, "Integer overflow");
            --stats.active_members;
            break;
         default:
            eosio::check(false, "Invariant failure: unknown member status");
            break;
      }
      member_stats.set(stats, contract);
      return member_tb.erase(iter);
   }

   void members::remove_if_pending(eosio::name account)
   {
      const auto& member = member_tb.get(account.value);
      if (member.status() == member_status::pending_membership)
      {
         member_tb.erase(member);
         auto stats = std::get<member_stats_v0>(member_stats.get_or_default());
         eosio::check(stats.pending_members != 0, "Integer overflow");
         --stats.pending_members;
         member_stats.set(stats, contract);
      }
   }

   void members::set_nft(eosio::name account, int32_t nft_template_id)
   {
      check_pending_member(account);
      const auto& member = get_member(account);
      member_tb.modify(member, eosio::same_payer,
                       [&](auto& row) { row.nft_template_id() = nft_template_id; });
   }

   void members::set_active(eosio::name account, const std::string& name)
   {
      auto stats = std::get<member_stats_v0>(member_stats.get());
      eosio::check(stats.pending_members > 0, "Invariant failure: no pending members");
      eosio::check(stats.active_members < max_active_members,
                   "Invariant failure: active members too high");
      --stats.pending_members;
      ++stats.active_members;
      member_stats.set(stats, eosio::same_payer);
      check_pending_member(account);
      election_state_singleton election_state(contract, default_scope);
      auto election_sequence = election_state.get_or_default().election_sequence;
      const auto& member = get_member(account);
      member_tb.modify(member, eosio::same_payer, [&](auto& row) {
         row.value = member_v1{{.account = row.account(),
                                .name = name,
                                .status = member_status::active_member,
                                .nft_template_id = row.nft_template_id(),
                                .election_sequence = election_sequence}};
      });
   }

   void members::renew(eosio::name account)
   {
      election_state_singleton election_state(contract, default_scope);
      auto election_sequence = election_state.get_or_default().election_sequence;
      const auto& member = get_member(account);
      if (member.election_sequence() + 1 < election_sequence)
      {
         // TODO: Do we allow members to renew after their membership lapses
         // or do they need to go through a new induction?
         // If we do allow it, how long do we retain the old records?
         eosio::check(false, "Membership has expired");
      }
      else if (member.election_sequence() + 1 > election_sequence ||
               current_election_state_singleton(contract, default_scope).exists())
      {
         eosio::check(false, "Cannot donate at this time");
      }
      member_tb.modify(member, eosio::same_payer, [&](auto& row) {
         row.value = member_v1{{.account = row.account(),
                                .name = row.name(),
                                .status = member_status::active_member,
                                .nft_template_id = row.nft_template_id(),
                                .election_sequence = row.election_sequence() + 1}};
      });
   }

   struct member_stats_v0 members::stats() { return std::get<member_stats_v0>(member_stats.get()); }

   void members::clear_all()
   {
      auto members_itr = member_tb.lower_bound(0);
      while (members_itr != member_tb.end())
         member_tb.erase(members_itr++);
      member_stats.remove();
   }
}  // namespace eden
