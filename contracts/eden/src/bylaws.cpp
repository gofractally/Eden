#include <bylaws.hpp>
#include <elections.hpp>
#include <eosio/crypto.hpp>
#include <eosio/system.hpp>

namespace eden
{
   constexpr auto proposed = "proposed"_n;
   constexpr auto pending = "pending"_n;
   constexpr auto ratified = "ratified"_n;

   void bylaws::set_proposed(eosio::name proposer, const std::string& proposal)
   {
      election_state_singleton state_sing(contract, default_scope);
      auto state = std::get<election_state_v0>(state_sing.get());
      eosio::check(proposer == state.lead_representative,
                   "Only the lead representative can set the proposed bylaws");
      auto setter = [&](auto& row) {
         row.value =
             bylaws_v0{.type = proposed, .text = proposal, .time = eosio::current_block_time()};
      };
      auto pos = bylaws_tb.find(proposed.value);
      if (pos != bylaws_tb.end())
      {
         bylaws_tb.modify(pos, contract, setter);
      }
      else
      {
         bylaws_tb.emplace(contract, setter);
      }
   }

   void bylaws::approve(eosio::name current_state,
                        eosio::name next_state,
                        eosio::name approver,
                        const eosio::checksum256& proposal_hash)
   {
      auto pos = bylaws_tb.find(current_state.value);
      eosio::check(pos != bylaws_tb.end(), "No " + current_state.to_string() + " bylaws");
      eosio::check(eosio::sha256(pos->text().data(), pos->text().size()) == proposal_hash,
                   "bylaws hash does not match " + current_state.to_string() + " bylaws");
      election_state_singleton state_sing(contract, default_scope);
      auto state = std::get<election_state_v0>(state_sing.get());
      elections elections{contract};
      auto next_election_time = elections.get_next_election_time();
      eosio::check(next_election_time && eosio::current_block_time() < *next_election_time,
                   "Bylaws cannot be approved while an election is running");
      eosio::check(std::find(pos->approvals().begin(), pos->approvals().end(), approver) ==
                       pos->approvals().end(),
                   "Already approved");
      eosio::check(std::find(state.board.begin(), state.board.end(), approver) != state.board.end(),
                   "Not a board member");
      if (next_state == ratified)
      {
         eosio::check(
             pos->time().to_time_point() + eosio::days(90) <=
                 state.last_election_time.to_time_point(),
             "Bylaws can only be approved if they were proposed at least 90 days before the last "
             "election.");
      }
      if (pos->approvals().size() >= state.board.size() * 2 / 3)
      {
         auto set_next_state = [&](auto& row) {
            row.value = bylaws_v0{
                .type = next_state, .text = pos->text(), .time = eosio::current_block_time()};
         };
         auto pending_iter = bylaws_tb.find(next_state.value);
         if (pending_iter == bylaws_tb.end())
         {
            bylaws_tb.emplace(contract, set_next_state);
         }
         else
         {
            bylaws_tb.modify(pending_iter, contract, set_next_state);
         }
         bylaws_tb.erase(pos);
      }
      else
      {
         bylaws_tb.modify(pos, contract, [&](auto& row) { row.approvals().push_back(approver); });
      }
   }

   void bylaws::approve_proposed(eosio::name approver, const eosio::checksum256& proposal_hash)
   {
      approve(proposed, pending, approver, proposal_hash);
   }

   void bylaws::approve_pending(eosio::name approver, const eosio::checksum256& proposal_hash)
   {
      approve(pending, ratified, approver, proposal_hash);
   }

   void bylaws::new_board()
   {
      auto pos = bylaws_tb.find(proposed.value);
      if (pos != bylaws_tb.end())
      {
         bylaws_tb.erase(pos);
      }
      pos = bylaws_tb.find(pending.value);
      if (pos != bylaws_tb.end())
      {
         bylaws_tb.modify(pos, contract, [](auto& row) { row.approvals().clear(); });
      }
   }

   void bylaws::on_resign(eosio::name member)
   {
      for (auto key : {proposed, pending})
      {
         auto pos = bylaws_tb.find(key.value);
         if (pos != bylaws_tb.end())
         {
            auto approval_iter =
                std::find(pos->approvals().begin(), pos->approvals().end(), member);
            if (approval_iter != pos->approvals().end())
            {
               bylaws_tb.modify(pos, contract,
                                [&](auto& row) { row.approvals().erase(approval_iter); });
            }
         }
      }
   }

   void bylaws::clear_all() { clear_table(bylaws_tb); }
}  // namespace eden
