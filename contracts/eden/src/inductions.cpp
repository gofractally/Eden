#include <algorithm>
#include <eden-atomicassets.hpp>
#include <eosio/action.hpp>
#include <eosio/crypto.hpp>
#include <inductions.hpp>
#include <set>

using namespace std::literals::string_literals;

namespace eden
{
   void inductions::initialize_induction(uint64_t id,
                                         eosio::name inviter,
                                         eosio::name invitee,
                                         const std::vector<eosio::name>& witnesses)
   {
      check_new_induction(invitee, inviter);
      check_valid_endorsers(inviter, witnesses);
      eosio::check(eosio::is_account(invitee),
                   "Account " + invitee.to_string() + " does not exist");

      uint32_t total_endorsements = witnesses.size() + 1;
      create_induction(id, inviter, invitee, total_endorsements);

      // create endorsement for inviter and witnesses (witnesses + 1)
      create_endorsement(inviter, invitee, inviter, id);
      for (const auto& witness : witnesses)
      {
         create_endorsement(inviter, invitee, witness, id);
      }
   }

   void inductions::create_induction(uint64_t id,
                                     eosio::name inviter,
                                     eosio::name invitee,
                                     uint32_t endorsements,
                                     const std::string& video)
   {
      induction_tb.emplace(contract, [&](auto& row) {
         row.value = induction_v0{.id = id,
                                  .inviter = inviter,
                                  .invitee = invitee,
                                  .endorsements = endorsements,
                                  .created_at = eosio::current_block_time(),
                                  .video = video,
                                  .new_member_profile = {}};
      });
   }

   void inductions::create_endorsement(eosio::name inviter,
                                       eosio::name invitee,
                                       eosio::name endorser,
                                       uint64_t induction_id,
                                       bool endorsed)
   {
      endorsement_tb.emplace(contract, [&](auto& row) {
         row.id() = endorsement_tb.available_primary_key();
         row.inviter() = inviter;
         row.invitee() = invitee;
         row.endorser() = endorser;
         row.induction_id() = induction_id;
         row.endorsed() = endorsed;
      });
   }

   void inductions::add_endorsement(const induction& induction, eosio::name endorser, bool endorsed)
   {
      induction_tb.modify(induction, contract, [&](auto& row) { ++row.endorsements(); });
      create_endorsement(induction.inviter(), induction.invitee(), endorser, induction.id(),
                         endorsed);
   }

   void inductions::update_expiration(const induction& induction, eosio::time_point new_expiration)
   {
      eosio::block_timestamp new_created_at(new_expiration -
                                            eosio::seconds(induction_expiration_secs));
      auto current_time = eosio::current_block_time().to_time_point();
      eosio::check(new_created_at > induction.created_at(),
                   "New expiration must be later than the current expiration");
      eosio::check(new_expiration >= current_time, "New expiration is in the past");
      eosio::check((new_expiration - current_time).to_seconds() <= induction_expiration_secs,
                   "New expiration is too far in the future");
      induction_tb.modify(induction, contract,
                          [&](auto& row) { row.created_at() = new_created_at; });
   }

   void inductions::update_profile(const induction& induction,
                                   const new_member_profile& new_member_profile)
   {
      check_valid_induction(induction);
      validate_profile(new_member_profile);

      induction_tb.modify(induction_tb.iterator_to(induction), eosio::same_payer,
                          [&](auto& row) { row.new_member_profile() = new_member_profile; });

      reset_endorsements(induction.id());
   }

   void inductions::reset_endorsements(uint64_t induction_id)
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction_id);
      while (itr != endorsement_idx.end() && itr->induction_id() == induction_id)
      {
         endorsement_idx.modify(itr, eosio::same_payer, [&](auto& row) { row.endorsed() = false; });
         itr++;
      }
   }

   void inductions::check_valid_endorsers(eosio::name inviter,
                                          const std::vector<eosio::name>& witnesses) const
   {
      eosio::check(witnesses.size() >= 2 && witnesses.size() <= 5,
                   "2 to 5 witnesses are required for induction");

      std::set<eosio::name> unique_witnesses_set(witnesses.begin(), witnesses.end());
      eosio::check(unique_witnesses_set.size() == witnesses.size(),
                   "the witnesses list has a duplicated entry");

      eosio::check(!unique_witnesses_set.contains(inviter),
                   "inviter cannot be in the witnesses list");
   }

   void inductions::check_new_induction(eosio::name invitee, eosio::name inviter) const
   {
      auto invitee_index = induction_tb.get_index<"byinvitee"_n>();

      auto invitee_key = combine_names(invitee, inviter);
      auto itr = invitee_index.find(invitee_key);

      eosio::check(itr == invitee_index.end(),
                   "induction for this invitation is already in progress");
   }

   const induction& inductions::get_induction(uint64_t id) const
   {
      return induction_tb.get(id, "unable to find induction");
   }

   const induction& inductions::get_endorsed_induction(eosio::name invitee) const
   {
      endorsed_induction_table_type endorsed_induction_tb(contract, default_scope);
      const auto& endorsed_induction = endorsed_induction_tb.get(
          invitee.value, ("unable to find endorsed induction for " + invitee.to_string()).c_str());
      return get_induction(endorsed_induction.induction_id);
   }

   bool inductions::is_valid_induction(const induction& induction) const
   {
      auto induction_lifetime =
          eosio::current_time_point() - induction.created_at().to_time_point();
      return induction_lifetime.to_seconds() <= induction_expiration_secs;
   }

   void inductions::check_valid_induction(const induction& induction) const
   {
      eosio::check(is_valid_induction(induction), "induction has expired");
   }

   void inductions::update_video(const induction& induction, const std::string& video)
   {
      check_valid_induction(induction);
      validate_video(video);

      induction_tb.modify(induction_tb.iterator_to(induction), eosio::same_payer,
                          [&](auto& row) { row.video() = video; });

      reset_endorsements(induction.id());
   }

   void inductions::endorse(const induction& induction,
                            eosio::name account,
                            eosio::checksum256 induction_data_hash)
   {
      check_valid_induction(induction);
      eosio::check(!induction.video().empty(), "Video not set");
      eosio::check(!induction.new_member_profile().name.empty(), "Profile not set");

      auto bin =
          eosio::convert_to_bin(std::tuple(induction.video(), induction.new_member_profile()));
      auto actual_hash = eosio::sha256(bin.data(), bin.size());
      eosio::check(actual_hash == induction_data_hash, "Outdated endorsement");

      auto endorsement_idx = endorsement_tb.get_index<"byendorser"_n>();
      const auto& endorsement = endorsement_idx.get(
          uint128_t{account.value} << 64 | induction.id(),
          ("unable to find endorsement for endorser " + account.to_string()).c_str());
      eosio::check(!endorsement.endorsed(), "Already endorsed");
      endorsement_tb.modify(endorsement, eosio::same_payer,
                            [&](auto& row) { row.endorsed() = true; });
   }

   void inductions::endorse_all(const induction& induction)
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id());
      while (itr != endorsement_idx.end() && itr->induction_id() == induction.id())
      {
         endorsement_idx.modify(itr, eosio::same_payer, [](auto& row) { row.endorsed() = true; });
         itr++;
      }
   }

   void inductions::create_nft(const induction& induction)
   {
      check_is_fully_endorsed(induction.id());

      endorsed_induction_table_type endorsed_induction_tb(contract, default_scope);
      endorsed_induction_tb.emplace(contract, [&](auto& row) {
         row.invitee = induction.invitee();
         row.induction_id = induction.id();
      });

      atomicassets::attribute_map immutable_data = {
          {"account", induction.invitee().to_string()},
          {"name", induction.new_member_profile().name},
          {"img", induction.new_member_profile().img},
          {"bio", induction.new_member_profile().bio},
          {"social", induction.new_member_profile().social},
          {"video", induction.video()}};
      if (!induction.new_member_profile().attributions.empty())
      {
         immutable_data.push_back({"attributions", induction.new_member_profile().attributions});
      }
      const auto collection_name = contract;
      const auto max_supply = (globals.get().stage == contract_stage::genesis)
                                  ? 0u
                                  : uint32_t{induction.endorsements() + 2};
      eosio::action{{contract, "active"_n},
                    atomic_assets_account,
                    "createtempl"_n,
                    std::tuple{contract, collection_name, schema_name, true, true, max_supply,
                               immutable_data}}
          .send();

      // Finalize and clean up induction state.  Must happen last.
      eosio::action{{contract, "active"_n}, contract, "inducted"_n, induction.invitee()}.send();
   }

   void inductions::mint_nft(int template_id, eosio::name new_asset_owner)
   {
      const auto collection_name = contract;
      eosio::action{{contract, "active"_n},
                    atomic_assets_account,
                    "mintasset"_n,
                    std::tuple{contract, collection_name, schema_name, template_id, new_asset_owner,
                               atomicassets::attribute_map{}, atomicassets::attribute_map{},
                               std::vector<eosio::asset>{}}}
          .send();
   }

   void inductions::create_nfts(const induction& induction, int32_t template_id)
   {
      std::vector<eosio::name> new_owners;
      new_owners.push_back(contract);
      new_owners.push_back(induction.invitee());
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id());
      while (itr != endorsement_idx.end() && itr->induction_id() == induction.id())
      {
         new_owners.push_back(itr->endorser());
         itr++;
      }

      for (eosio::name new_asset_owner : new_owners)
      {
         mint_nft(template_id, new_asset_owner);
      }
   }

   void inductions::check_is_fully_endorsed(uint64_t induction_id) const
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction_id);
      while (itr != endorsement_idx.end() && itr->induction_id() == induction_id)
      {
         eosio::check(itr->endorsed(), "induction is not fully endorsed");
         itr++;
      }
   }

   void inductions::start_auction(const induction& induction, uint64_t asset_id)
   {
      eosio::action{{contract, "active"_n},
                    atomic_market_account,
                    "announceauct"_n,
                    std::tuple(contract, std::vector{asset_id}, globals.get().auction_starting_bid,
                               globals.get().auction_duration, eosio::name{})}
          .send();
      eosio::action{{contract, "active"_n},
                    atomic_assets_account,
                    "transfer"_n,
                    std::tuple(contract, atomic_market_account, std::vector{asset_id}, "auction"s)}
          .send();
   }

   void inductions::erase_induction(const induction& induction)
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id());
      while (itr != endorsement_idx.end() && itr->induction_id() == induction.id())
      {
         itr = endorsement_idx.erase(itr);
      }
      endorsed_induction_table_type endorsed_induction_tb(contract, default_scope);
      if (auto itr = endorsed_induction_tb.find(induction.invitee().value);
          itr != endorsed_induction_tb.end())
      {
         endorsed_induction_tb.erase(itr);
      }
      auto invitee = induction.invitee();
      induction_tb.erase(induction);
   }

   uint32_t inductions::erase_by_inductee(eosio::name invitee, uint32_t limit)
   {
      auto invitee_idx = induction_tb.get_index<"byinvitee"_n>();
      auto iter = invitee_idx.lower_bound(combine_names(invitee, eosio::name()));
      auto end = invitee_idx.end();
      while (iter != end && limit > 0 && iter->invitee() == invitee)
      {
         auto next = iter;
         ++next;
         erase_induction(*iter);
         iter = next;
         --limit;
      }
      return limit;
   }

   uint32_t inductions::gc(uint32_t limit, std::vector<eosio::name>& removed_members)
   {
      limit = erase_expired(limit, removed_members);
      induction_gc_table_type gc_tb(contract, default_scope);
      auto iter = gc_tb.begin();
      auto end = gc_tb.end();
      while (iter != end && limit > 0)
      {
         limit = erase_by_inductee(iter->invitee, limit);
         if (limit)
         {
            iter = gc_tb.erase(iter);
            --limit;
         }
      }
      return limit;
   }

   void inductions::queue_gc(eosio::name invitee)
   {
      induction_gc_table_type gc_tb(contract, default_scope);
      gc_tb.emplace(contract, [=](auto& row) { row.invitee = invitee; });
   }

   uint32_t inductions::erase_expired(uint32_t limit, std::vector<eosio::name>& removed_members)
   {
      auto created_idx = induction_tb.get_index<"bycreated"_n>();
      auto iter = created_idx.begin();
      auto end = created_idx.end();
      while (iter != end && limit > 0 && !is_valid_induction(*iter))
      {
         auto next = iter;
         ++next;
         auto invitee = iter->invitee();
         erase_induction(*iter);
         if (!has_induction(invitee))
         {
            removed_members.push_back(invitee);
         }
         iter = next;
         --limit;
      }
      return limit;
   }

   void inductions::erase_endorser(eosio::name endorser)
   {
      auto endorser_idx = endorsement_tb.get_index<"byendorser"_n>();
      auto pos = endorser_idx.lower_bound(uint128_t{endorser.value} << 64);
      auto end = endorser_idx.end();
      while (pos != end && pos->endorser() == endorser)
      {
         induction_tb.modify(induction_tb.get(pos->induction_id()), contract, [&](auto& row) {
            eosio::check(
                --row.endorsements() > 0,
                "Not enough remaining endorsers.  It should be safe to clear the contract, "
                "however, as this should only happen if no NFTs have been issued yet...");
         });
         pos = endorser_idx.erase(pos);
      }
   }

   void inductions::validate_profile(const new_member_profile& new_member_profile) const
   {
      eosio::check(!new_member_profile.name.empty(), "new member profile name is empty");
      atomicassets::validate_ipfs(new_member_profile.img);
      eosio::check(!new_member_profile.bio.empty(), "new member profile bio is empty");
   }

   void inductions::validate_video(const std::string& video) const
   {
      atomicassets::validate_ipfs(video);
   }

   bool inductions::is_endorser(uint64_t id, eosio::name witness) const
   {
      auto endorser_idx = endorsement_tb.get_index<"byendorser"_n>();
      return endorser_idx.find(uint128_t{witness.value} << 64 | id) != endorser_idx.end();
   }

   bool inductions::has_induction(eosio::name invitee) const
   {
      auto invitee_idx = induction_tb.get_index<"byinvitee"_n>();
      auto pos = invitee_idx.lower_bound(combine_names(invitee, {}));
      return pos != invitee_idx.end() && pos->invitee() == invitee;
   }

   void inductions::clear_all()
   {
      auto inductions_itr = induction_tb.lower_bound(0);
      while (inductions_itr != induction_tb.end())
      {
         induction_tb.erase(inductions_itr++);
      }

      auto endorsements_itr = endorsement_tb.lower_bound(0);
      while (endorsements_itr != endorsement_tb.end())
      {
         endorsement_tb.erase(endorsements_itr++);
      }
   }

}  // namespace eden
