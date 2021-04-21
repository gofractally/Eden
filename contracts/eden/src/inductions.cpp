#include <inductions.hpp>
#include <atomicassets.hpp>
#include <set>
#include <algorithm>
#include <eosio/crypto.hpp>

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

      induction_tb.emplace(contract, [&](auto& row) {
         row.id = id;
         row.inviter = inviter;
         row.invitee = invitee;
         row.endorsements = witnesses.size() + 1;
         row.created_at = eosio::current_block_time();
         row.video = "";
         row.new_member_profile = {};
      });

      // create endorsement for inviter
      create_endorsement(inviter, invitee, inviter, id);

      // create endorsement for each witness
      for (const auto& witness : witnesses)
      {
         create_endorsement(inviter, invitee, inviter, id);
      }
   }

   void inductions::create_endorsement(eosio::name inviter,
                                       eosio::name invitee,
                                       eosio::name endorser,
                                       uint64_t induction_id)
   {
      endorsement_tb.emplace(contract, [&](auto& row) {
         row.id = endorsement_tb.available_primary_key();
         row.inviter = inviter;
         row.invitee = invitee;
         row.endorser = endorser;
         row.induction_id = induction_id;
         row.endorsed = false;
      });
   }

   void inductions::update_profile(const induction& induction,
                                   const new_member_profile& new_member_profile)
   {
      check_valid_induction(induction);
      validate_profile(new_member_profile);

      induction_tb.modify(induction_tb.iterator_to(induction), eosio::same_payer,
                          [&](auto& row) { row.new_member_profile = new_member_profile; });

      reset_endorsements(induction.id);
   }

   void inductions::reset_endorsements(uint64_t induction_id)
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction_id);
      while (itr != endorsement_idx.end() && itr->induction_id == induction_id)
      {
         endorsement_idx.modify(itr, eosio::same_payer, [&](auto& row) { row.endorsed = false; });
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

   void inductions::check_valid_induction(const induction& induction) const
   {
      auto induction_lifetime = eosio::current_time_point() - induction.created_at.to_time_point();
      eosio::check(induction_lifetime.to_seconds() <= induction_expiration_secs,
                   "induction has expired");
   }

   void inductions::update_video(const induction& induction,
                                 const std::string& video)
   {
      check_valid_induction(induction);
      validate_video(video);

      induction_tb.modify(induction_tb.iterator_to(induction), eosio::same_payer,
                          [&](auto& row) { row.video = video; });

      reset_endorsements(induction.id);
   }

   void inductions::endorse(const induction& induction, eosio::name account, eosio::checksum256 induction_data_hash)
   {
      check_valid_induction(induction);
      eosio::check(!induction.video.empty(), "Video not set");
      eosio::check(!induction.new_member_profile.name.empty(), "Profile not set");

      auto bin = eosio::convert_to_bin(std::tuple(induction.video, induction.new_member_profile));
      auto actual_hash = eosio::sha256(bin.data(), bin.size());
      eosio::check(actual_hash == induction_data_hash, "Outdated endorsement");

      auto endorsement_idx = endorsement_tb.get_index<"byendorser"_n>();
      auto endorsement = endorsement_idx.get(uint128_t{account.value} << 64 | induction.id);
      eosio::check(!endorsement.endorsed, "Already endorsed");
      endorsement_tb.modify(endorsement, eosio::same_payer, [&](auto& row) { row.endorsed = true; });

      maybe_create_nft(induction);
   }

   void inductions::maybe_create_nft(const induction& induction) {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id);
      while (itr != endorsement_idx.end() && itr->induction_id == induction.id)
      {
         if(!itr->endorsed) return;
      }

      atomicassets::attribute_map immutable_data = {
         {"edenac", induction.invitee.to_string()},
         {"name", induction.new_member_profile.name},
         {"img", induction.new_member_profile.img},
         {"bio", induction.new_member_profile.bio},
         {"social", induction.new_member_profile.social},
         {"inductionvid", induction.video}
      };
      eosio::action{{contract, "active"_n}, atomic_assets_account, "createtempl"_n, std::tuple{contract, collection_name, schema_name, true, true, uint32_t{induction.endorsements + 2}, immutable_data}}.send();
   }

   void inductions::create_nfts(const induction& induction, int32_t template_id)
   {
      std::vector<eosio::name> new_owners;
      new_owners.push_back(contract);
      new_owners.push_back(induction.invitee);
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id);
      while (itr != endorsement_idx.end() && itr->induction_id == induction.id)
      {
         new_owners.push_back(itr->endorser);
      }

      for(eosio::name new_asset_owner : new_owners)
      {
         eosio::action{{contract, "active"_n}, atomic_assets_account, "mintasset"_n, std::tuple{contract, collection_name, schema_name, template_id, new_asset_owner, atomicassets::attribute_map{}, atomicassets::attribute_map{}, std::vector<eosio::asset>{}}}.send();
      }
   }

   void inductions::start_auction(const induction& induction, int32_t template_id, uint64_t asset_id)
   {
      eosio::action{{contract, "active"_n}, atomic_market_account, "announceauct"_n, std::tuple(contract, std::vector{asset_id}, auction_starting_bid, auction_duration, eosio::name{})}.send();
      eosio::action{{contract, "active"_n}, atomic_assets_account, "transfer"_n, std::tuple(contract, atomic_market_account, std::vector{asset_id}, "auction"s)}.send();
   }

   void inductions::erase_induction(const induction& induction)
   {
      auto endorsement_idx = endorsement_tb.get_index<"byinduction"_n>();
      auto itr = endorsement_idx.lower_bound(induction.id);
      while (itr != endorsement_idx.end() && itr->induction_id == induction.id)
      {
         itr = endorsement_idx.erase(itr);
      }
      induction_tb.erase(induction);
   }

   void inductions::validate_profile(const new_member_profile& new_member_profile) const
   {
      eosio::check(!new_member_profile.name.empty(), "new member profile name is empty");
      eosio::check(!new_member_profile.img.empty(), "new member profile img is empty");
      eosio::check(!new_member_profile.bio.empty(), "new member profile bio is empty");
      // TODO: add more checks (valid ipfs img, bio and name minimum length)
   }

   void inductions::validate_video(const std::string& video) const
   {
      // TODO: check that video is a valid IPFS CID.
   }

   bool inductions::is_endorser(uint64_t id, eosio::name witness) const
   {
      auto endorser_idx = endorsement_tb.get_index<"byendorser"_n>();
      return endorser_idx.find(uint128_t{witness.value} << 64 | id) != endorser_idx.end();
   }

}  // namespace eden
