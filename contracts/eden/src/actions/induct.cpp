#include <accounts.hpp>
#include <auctions.hpp>
#include <bylaws.hpp>
#include <distributions.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <inductions.hpp>
#include <members.hpp>
#include <migrations.hpp>

namespace eden
{
   void eden::inductinit(uint64_t id,
                         eosio::name inviter,
                         eosio::name invitee,
                         std::vector<eosio::name> witnesses)
   {
      require_auth(inviter);

      globals{get_self()}.check_active();

      members members{get_self()};
      members.check_active_member(inviter);
      for (const auto& witness : witnesses)
      {
         members.check_active_member(witness);
      }
      if (members.is_new_member(invitee))
         members.create(invitee);
      else
         members.check_pending_member(invitee);

      inductions{get_self()}.initialize_induction(id, inviter, invitee, witnesses);
   }

   void eden::inductmeetin(eosio::name account,
                           uint64_t id,
                           const std::vector<encrypted_key>& keys,
                           const eosio::bytes& data,
                           const std::optional<eosio::bytes>& old_data)
   {
      require_auth(account);
      globals{get_self()}.check_active();

      members members{get_self()};
      inductions inductions{get_self()};
      eosio::check(inductions.is_endorser(id, account), "Cannot create this meeting");
      auto participants = inductions.get_endorsers(id);
      participants.push_back(inductions.get_induction(id).invitee());
      members.check_keys(participants, keys);
      encrypt encrypt{get_self(), "induction"_n};
      encrypt.set(id, keys, data, old_data);
   }

   void eden::inductprofil(uint64_t id, new_member_profile new_member_profile)
   {
      inductions inductions{get_self()};
      const auto& induction = inductions.get_induction(id);
      require_auth(induction.invitee());

      members{get_self()}.check_pending_member(induction.invitee());

      inductions.update_profile(induction, new_member_profile);

      globals globals{get_self()};
      if (globals.get().stage == contract_stage::genesis)
      {
         inductions.endorse_all(induction);
      }
   }

   void eden::inductvideo(eosio::name account, uint64_t id, std::string video)
   {
      require_auth(account);
      inductions inductions{get_self()};
      const auto& induction = inductions.get_induction(id);

      globals{get_self()}.check_active();
      members{get_self()}.check_pending_member(induction.invitee());

      eosio::check(inductions.is_endorser(id, account),
                   "Video can only be set by inviter or a witness");
      inductions.update_video(induction, video);
   }

   void eden::inductendors(eosio::name account, uint64_t id, eosio::checksum256 induction_data_hash)
   {
      require_auth(account);
      inductions inductions{get_self()};
      const auto& induction = inductions.get_induction(id);

      members members{get_self()};
      members.check_pending_member(induction.invitee());

      eosio::check(inductions.is_endorser(id, account),
                   "Induction can only be endorsed by inviter or a witness");
      // The endorser might have resigned
      members.check_active_member(account);
      inductions.endorse(induction, account, induction_data_hash);
   }

   void eden::inductdonate(eosio::name payer, uint64_t id, const eosio::asset& quantity)
   {
      eosio::require_auth(payer);

      globals globals{get_self()};
      inductions inductions{get_self()};
      accounts user_accounts{get_self()};

      const auto& induction = inductions.get_induction(id);
      eosio::check(payer == induction.invitee(), "only inductee may donate using this action");
      eosio::check(quantity == globals.get().minimum_donation, "incorrect donation");
      user_accounts.sub_balance(payer, quantity);
      migrations migrations{get_self()};
      if (auto migration = migrations.get<migrate_account_v0>())
      {
         migration->adjust_balance(payer, -quantity);
         migrations.set(*migration);
      }
      else if (migrations.is_completed<migrate_account_v0>())
      {
         add_to_pool(get_self(), "master"_n, quantity);
      }
      inductions.create_nft(induction);
   }

   void eden::inducted(eosio::name inductee)
   {
      eosio::require_auth(get_self());

      members members{get_self()};
      inductions inductions(get_self());
      const auto& induction = inductions.get_endorsed_induction(inductee);
      members.set_active(inductee, induction.new_member_profile().name);
      inductions.erase_induction(induction);

      // Attempt to clean up pending inductions for this member,
      // but give up if there are too many records to process.
      if (!inductions.erase_by_inductee(inductee, max_gc_on_induction))
      {
         inductions.queue_gc(inductee);
      }

      members.maybe_activate_contract();

      current_election_state_singleton elect_state{get_self(), default_scope};
      if (elect_state.exists())
      {
         auto state = elect_state.get();
         if (auto* reg = std::get_if<current_election_state_registration>(&state);
             reg && members.stats().active_members >= reg->election_threshold)
         {
            elections elections{get_self()};
            elections.trigger_election();
         }
      }
   }

   void eden::gc(uint32_t limit)
   {
      inductions inductions{get_self()};
      std::vector<eosio::name> removed_members;
      auto remaining = inductions.gc(limit, removed_members);
      if (remaining)
      {
         auctions auctions{get_self()};
         remaining = auctions.finish_auctions(remaining);
      }
      eosio::check(remaining != limit, "Nothing to do.");
      if (!removed_members.empty())
      {
         members members(get_self());
         for (auto member : removed_members)
         {
            members.remove_if_pending(member);
         }
         members.maybe_activate_contract();
      }
   }

   void eden::inductcancel(eosio::name account, uint64_t id)
   {
      eosio::require_auth(account);

      inductions inductions{get_self()};
      bool is_genesis = globals{get_self()}.get().stage == contract_stage::genesis;
      if (is_genesis)
      {
         eosio::check(account == get_self(), "Only an admin can cancel genesis inductions");
      }
      else
      {
         eosio::check(inductions.is_invitee(id, account) || inductions.is_endorser(id, account),
                      "Induction can only be canceled by an endorser or the invitee itself");
      }

      const auto& induction = inductions.get_induction(id);
      auto invitee = induction.invitee();
      inductions.erase_induction(induction);
      if (!inductions.has_induction(invitee))
      {
         members members(get_self());
         members.remove_if_pending(invitee);
         if (is_genesis)
         {
            inductions.erase_endorser(invitee);
            members.maybe_activate_contract();
         }
      }
   }

   void eden::resign(eosio::name account)
   {
      eosio::require_auth(account);
      members members{get_self()};
      members.check_active_member(account);
      distributions dist{get_self()};
      dist.on_resign(members.get_member(account));
      elections elections{get_self()};
      elections.on_resign(account);
      members.remove(account);
      bylaws bylaws{get_self()};
      bylaws.on_resign(account);
   }

}  // namespace eden
