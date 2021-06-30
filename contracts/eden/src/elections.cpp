#include <bylaws.hpp>
#include <distributions.hpp>
#include <elections.hpp>
#include <eosio/crypto.hpp>
#include <eosio/system.hpp>
#include <members.hpp>

namespace eden
{
   election_rng::election_rng(const eosio::checksum256& seed)
   {
      auto a = seed.extract_as_byte_array();
      memcpy(inbuf, a.data(), a.size());
      memset(inbuf + 32, 0, 8);
      index = 32;
   }

   election_rng::result_type election_rng::operator()()
   {
      if (index >= 32)
      {
         auto a = eosio::sha256(inbuf, sizeof(inbuf)).extract_as_byte_array();
         memcpy(outbuf, a.data(), a.size());
         uint64_t counter;
         memcpy(&counter, inbuf + 32, sizeof(counter));
         ++counter;
         memcpy(inbuf + 32, &counter, sizeof(counter));
         index = 0;
      }
      result_type result;
      memcpy(&result, outbuf + index, sizeof(result_type));
      index += sizeof(result_type);
      return result;
   }

   eosio::checksum256 election_rng::seed() const
   {
      std::array<uint8_t, 32> bytes;
      memcpy(bytes.data(), inbuf, 32);
      return eosio::checksum256(bytes);
   }

   void election_seeder::update(eosio::input_stream& bytes)
   {
      eosio::check(bytes.remaining() >= 80, "Stream overrun");
      auto hash1 = eosio::sha256(bytes.pos, 80);
      auto hash2 = eosio::sha256(reinterpret_cast<char*>(hash1.extract_as_byte_array().data()), 32);
      eosio::check(hash2 < current, "New seed block must have greater POW than previous seed.");
      eosio::time_point_sec block_time;
      bytes.skip(4 + 32 + 32);
      eosio::from_bin(block_time, bytes);
      bytes.skip(4 + 4);
      eosio::check(block_time >= eosio::time_point_sec(start_time), "Seed block is too early");
      eosio::check(block_time < eosio::time_point_sec(end_time), "Seed block is too late");
      current = hash2;
   }

   static uint32_t int_pow(uint32_t base, uint32_t exponent)
   {
      uint32_t result = 1;
      for (uint32_t i = 0; i < exponent; ++i)
      {
         result *= base;
      }
      return result;
   }

   uint32_t int_root(uint32_t x, uint32_t y)
   {
      // find z, such that $z^y \le x < (z+1)^y$
      //
      // hard coded limits based on the election constraints
      uint32_t low = 0, high = 12;
      while (high - low > 1)
      {
         uint32_t mid = (high + low) / 2;
         if (x < int_pow(mid, y))
         {
            high = mid;
         }
         else
         {
            low = mid;
         }
      }
      return low;
   }

   std::size_t count_rounds(uint32_t num_members)
   {
      std::size_t result = 1;
      for (uint32_t i = 12; i <= num_members; i *= 4)
      {
         ++result;
      }
      return result;
   }

   auto get_group_sizes(uint32_t num_members, std::size_t num_rounds)
   {
      auto basic_group_size = int_root(num_members, num_rounds);
      if (basic_group_size == 3)
      {
         std::vector<uint32_t> result(num_rounds, 4);
         // result.front() is always 4, but for some reason, that causes clang to miscompile this.
         // TODO: look for UB...
         auto large_rounds =
             static_cast<std::size_t>(std::log(static_cast<double>(num_members) /
                                               int_pow(result.front(), num_rounds - 1) / 3) /
                                      std::log(1.25));
         result.back() = 3;
         eosio::check(large_rounds <= 1,
                      "More that one large round is unexpected when the final group size is 3.");
         for (std::size_t i = result.size() - large_rounds - 1; i < result.size() - 1; ++i)
         {
            result[i] = 5;
         }
         return result;
      }
      else if (basic_group_size >= 6)
      {
         // 5,6,...,6,N
         std::vector<uint32_t> result(num_rounds, 6);
         result.front() = 5;
         auto divisor = int_pow(6, num_rounds - 1);
         result.back() = (num_members + divisor - 1) / divisor;
         return result;
      }
      else
      {
         // \lfloor \log_{(G+1)/G}\frac{N}{G^R} \rfloor
         auto large_rounds = static_cast<std::size_t>(
             std::log(static_cast<double>(num_members) / int_pow(basic_group_size, num_rounds)) /
             std::log((basic_group_size + 1.0) / basic_group_size));
         // x,x,x,x,x,x
         std::vector<uint32_t> result(num_rounds, basic_group_size + 1);
         std::fill_n(result.begin(), num_rounds - large_rounds, basic_group_size);
         return result;
      }
   }

   election_config make_election_config(uint16_t num_participants)
   {
      if (num_participants == 0)
         return {};
      auto sizes = get_group_sizes(num_participants, count_rounds(num_participants));
      election_config result(sizes.size());
      uint16_t next_participants = 1;
      for (uint32_t i = 0; i < sizes.size() - 1; ++i)
      {
         auto idx = result.size() - i - 1;
         uint16_t participants = next_participants * sizes[idx];
         result[idx] = {participants, next_participants};
         next_participants = participants;
      }
      result[0] = {num_participants, next_participants};
      return result;
   }

   // Divide members into groups so that the members of each group
   // have a contiguous range of ids.
   uint32_t election_round_config::member_index_to_group(uint32_t idx) const
   {
      auto num_large = num_large_groups();
      auto min_size = group_min_size();
      auto members_in_large = (min_size + 1) * num_large;
      if (idx < members_in_large)
      {
         return idx / (min_size + 1);
      }
      else
      {
         return (idx - members_in_large) / min_size + num_large;
      }
   }

   // Incremental implementation of shuffle
   // After adding all voters, each voter will have unique integer in [0, N) as
   // a group_id.
   void elections::add_voter(election_rng& rng,
                             uint8_t round,
                             uint16_t& next_index,
                             eosio::name member)
   {
      std::uniform_int_distribution<uint16_t> dist(0, next_index);
      auto pos = dist(rng);
      if (pos != next_index)
      {
         auto group_idx = vote_tb.get_index<"bygroup"_n>();
         const auto& old = group_idx.get((round << 16) | pos);
         group_idx.modify(old, eosio::same_payer, [&](auto& row) { row.index = next_index; });
      }
      vote_tb.emplace(contract, [&](auto& row) {
         row.member = member;
         row.round = round;
         row.index = pos;
      });
      ++next_index;
   }

   static eosio::time_point_sec get_election_time(uint32_t election_start_time,
                                                  eosio::time_point_sec base_time)
   {
      auto sys_time = std::chrono::time_point_cast<std::chrono::seconds>(
          std::chrono::system_clock::from_time_t(base_time.sec_since_epoch()));
      auto days = std::chrono::time_point_cast<std::chrono::days>(sys_time);
      auto time = sys_time - days;
      std::chrono::weekday start_day(days);
      auto target_time = std::chrono::seconds(election_start_time);
      auto target_day = std::chrono::duration_cast<std::chrono::days>(target_time);
      target_time -= target_day;
      std::chrono::seconds advance =
          (std::chrono::weekday(target_day.count()) - start_day) + (target_time - time);
      if (advance < std::chrono::seconds(0))
      {
         advance += std::chrono::days(7);
      }
      return base_time + advance.count();
   }

   std::optional<eosio::block_timestamp> elections::get_next_election_time()
   {
      if (!state_sing.exists())
      {
         return {};
      }
      auto state = state_sing.get();
      if (auto* r = std::get_if<current_election_state_registration>(&state))
      {
         return r->start_time;
      }
      else if (auto* s = std::get_if<current_election_state_seeding>(&state))
      {
         return s->seed.end_time.to_time_point();
      }
      return {};
   }

   void elections::set_next_election_time(eosio::time_point election_time)
   {
      auto lock_time = eosio::current_time_point() + eosio::days(30);
      eosio::check(election_time >= lock_time, "New election time is too close");
      if (state_sing.exists())
      {
         auto state = state_sing.get();
         eosio::check(
             std::holds_alternative<current_election_state_registration>(state) &&
                 std::get<current_election_state_registration>(state).start_time >= lock_time,
             "Election cannot be rescheduled");
      }
      state_sing.set(current_election_state_registration{election_time}, contract);
   }

   void elections::set_time(uint8_t day, const std::string& time)
   {
      auto get_digit = [](char ch) {
         eosio::check(ch >= '0' && ch <= '9', "Expected HH:MM");
         return ch - '0';
      };
      eosio::check(time.size() == 5 && time[2] == ':', "Expected HH:MM");
      auto hours = get_digit(time[0]) * 10 + get_digit(time[1]);
      auto minutes = get_digit(time[3]) * 10 + get_digit(time[4]);
      eosio::check(day < 7, "days out of range");
      eosio::check(hours < 24, "hours out of range");
      eosio::check(minutes < 60, "minutes out of range");
      globals.set_election_start_time(((24 * day + hours) * 60 + minutes) * 60);
      if (!state_sing.exists())
      {
         set_default_election(eosio::current_time_point());
      }
      else if (std::holds_alternative<current_election_state_pending_date>(state_sing.get()))
      {
         trigger_election();
      }
   }

   void elections::set_default_election(eosio::time_point_sec origin_time)
   {
      const auto& state = globals.get();
      member_stats_singleton stats{contract, default_scope};
      uint16_t active_members =
          stats.exists() ? std::visit([](const auto& s) { return s.active_members; }, stats.get())
                         : 0;
      uint16_t new_threshold = active_members + (active_members + 9) / 10;
      new_threshold = std::clamp(new_threshold, min_election_threshold, max_active_members);
      state_sing.set(
          current_election_state_registration{
              get_election_time(state.election_start_time, origin_time + eosio::days(180)),
              new_threshold},
          contract);
   }

   // Schedules an election at the earliest possible time at least 30 days
   // in the future.
   void elections::trigger_election()
   {
      eosio::time_point_sec now = eosio::current_time_point();
      const auto& state = globals.get();
      if (state.election_start_time == 0xffffffff)
      {
         // If we've met the conditions for triggering an election, but the
         // date has not been set (only possible if genesis was run using
         // a prior version of the contract), wait until the date is set
         // before scheduling the election.
         state_sing.set(current_election_state_pending_date{}, contract);
      }
      else
      {
         eosio::check(state_sing.exists(), "Invariant failure: missing election state");
         // Ignore events that would trigger an election unless they move
         // the next election closer.
         auto current_state = state_sing.get();
         if (auto* current = std::get_if<current_election_state_registration>(&current_state))
         {
            auto new_start_time = eosio::block_timestamp{
                get_election_time(state.election_start_time, now + eosio::days(30))};
            if (new_start_time < current->start_time)
            {
               state_sing.set(current_election_state_registration{new_start_time}, contract);
            }
         }
      }
   }

   void elections::seed(const eosio::bytes& btc_header)
   {
      eosio::check(btc_header.data.size() == 80, "Wrong size for BTC block header");
      auto state = state_sing.get();
      if (auto* registration = std::get_if<current_election_state_registration>(&state))
      {
         auto now = eosio::current_block_time();
         eosio::block_timestamp seeding_start =
             eosio::time_point(registration->start_time) - eosio::seconds(election_seeding_window);
         eosio::check(now >= seeding_start, "Cannot start seeding yet");
         state = current_election_state_seeding{
             {.start_time = seeding_start, .end_time = registration->start_time.to_time_point()}};
      }
      if (auto* seeding = std::get_if<current_election_state_seeding>(&state))
      {
         eosio::input_stream stream{btc_header.data};
         seeding->seed.update(stream);
      }
      else if (auto* seeding = std::get_if<current_election_state_final>(&state))
      {
         eosio::input_stream stream{btc_header.data};
         seeding->seed.update(stream);
      }
      else
      {
         eosio::check(false, "Cannot seed election now");
      }
      state_sing.set(state, contract);
   }

   void elections::start_election()
   {
      eosio::check(std::holds_alternative<current_election_state_seeding>(state_sing.get()),
                   "Election seed not set");
      auto old_state = std::get<current_election_state_seeding>(state_sing.get());
      auto election_start_time = old_state.seed.end_time.to_time_point();
      eosio::check(eosio::current_block_time() >= old_state.seed.end_time,
                   "Seeding window is still open");
      state_sing.set(current_election_state_init_voters{0, election_rng{old_state.seed.current}},
                     contract);

      // Must happen after the election is started
      setup_distribution(contract, election_start_time);

      election_state_singleton state(contract, default_scope);
      auto state_value = std::get<election_state_v0>(state.get_or_default());
      state_value.last_election_time = election_start_time;
      state.set(state_value, contract);

      {
         members members(contract);
         members.clear_ranks();
      }

      bylaws bylaws(contract);
      bylaws.new_board();
   }

   uint32_t elections::randomize_voters(current_election_state_init_voters& state,
                                        uint32_t max_steps)
   {
      election_state_singleton sequence_state(contract, default_scope);
      members members(contract);
      const auto& member_tb = members.get_table();
      auto iter = member_tb.upper_bound(state.last_processed.value);
      auto end = member_tb.end();
      for (; max_steps > 0 && iter != end; --max_steps)
      {
         if (iter->status() == member_status::active_member)
         {
            switch (iter->election_participation_status())
            {
               case no_donation:
               {
                  // TODO: handle budget cleanup
                  iter = members.erase(iter);
                  continue;
               }
               case in_election:
               {
                  add_voter(state.rng, 0, state.next_member_idx, iter->account());
                  break;
               }
               case recently_inducted:
               case not_in_election:
               {
                  members.set_rank(iter->account(), 0, eosio::name(-1));
                  break;
               }
            }
         }
         state.last_processed = iter->account();
         ++iter;
      }
      return max_steps;
   }

   uint32_t elections::prepare_election(uint32_t max_steps)
   {
      auto state_variant = state_sing.get();
      if (auto* state = std::get_if<current_election_state_seeding>(&state_variant))
      {
         if (max_steps == 0)
         {
            return max_steps;
         }
         start_election();
         state_variant = state_sing.get();
         --max_steps;
      }
      if (auto* state = std::get_if<current_election_state_init_voters>(&state_variant))
      {
         // This needs to happen before any members have their ranks adjusted
         max_steps = distribute_monthly(contract, max_steps);
         if (max_steps == 0)
         {
            return max_steps;
         }
         max_steps = randomize_voters(*state, max_steps);
         if (max_steps > 0)
         {
            eosio::check(state->next_member_idx > 0, "No voters");
            auto configs = make_election_config(state->next_member_idx);
            if (configs.size() == 1)
            {
               auto board = extract_board();
               auto winner = board.front();
               finish_election(std::move(board), winner);
               --max_steps;
               return max_steps;
            }
            else
            {
               state_variant = current_election_state_active{
                   0, configs.front(), state->rng.seed(),
                   eosio::current_time_point() +
                       eosio::seconds(globals.get().election_round_time_sec +
                                      globals.get().election_break_time_sec)};
            }
            --max_steps;
         }
      }
      state_sing.set(state_variant, contract);
      return max_steps;
   }

   current_election_state_active elections::check_active()
   {
      eosio::check(state_sing.exists(), "No election is running");
      auto state = state_sing.get();
      eosio::check(std::holds_alternative<current_election_state_active>(state),
                   "The election is not ready for voting");
      auto result = std::get<current_election_state_active>(state);
      eosio::check(eosio::current_block_time() < result.round_end,
                   "Voting period for this round has closed");
      return result;
   }

   static eosio::checksum256 adjust_seed(const eosio::checksum256& seed)
   {
      char buf[36];
      memcpy(buf, seed.extract_as_byte_array().data(), 32);
      eosio::block_timestamp timestamp = eosio::current_block_time();
      memcpy(buf + 32, &timestamp.slot, 4);
      return eosio::sha256(buf, 36);
   }

   struct group_result
   {
      eosio::name winner;
      std::vector<eosio::name> voted;
      std::vector<eosio::name> missing;
   };

   template <typename Idx, typename It>
   static group_result finish_group(current_election_state_post_round& state,
                                    Idx& group_idx,
                                    It& iter,
                                    uint8_t group_size)
   {
      // count votes
      group_result result;
      std::map<eosio::name, uint8_t> votes_by_candidate;
      for (uint32_t i = 0; i < group_size; ++i)
      {
         if (iter->candidate != eosio::name())
         {
            ++votes_by_candidate[iter->candidate];
            result.voted.push_back(iter->member);
         }
         else
         {
            result.missing.push_back(iter->member);
         }
         iter = group_idx.erase(iter);
      }
      auto best = std::max_element(
          votes_by_candidate.begin(), votes_by_candidate.end(),
          [](const auto& lhs, const auto& rhs) { return lhs.second < rhs.second; });
      if (!votes_by_candidate.empty() && 3 * best->second > 2 * group_size)
      {
         result.winner = best->first;
      }
      return result;
   }

   std::vector<eosio::name> elections::extract_board()
   {
      std::vector<eosio::name> result;
      auto vote_idx = vote_tb.get_index<"bygroup"_n>();
      for (auto iter = vote_idx.begin(), end = vote_idx.end(); iter != end;)
      {
         result.push_back(iter->member);
         eosio::check(result.size() < 12, "Too many board members");
         iter = vote_idx.erase(iter);
      }
      eosio::check(!result.empty(), "No board members");
      return result;
   }

   void elections::finish_election(std::vector<eosio::name>&& board, eosio::name winner)
   {
      election_state_singleton results(contract, default_scope);
      auto result = std::get<election_state_v0>(results.get());
      result.lead_representative = winner;
      result.board = std::move(board);
      set_default_election(result.last_election_time.to_time_point());
      members members{contract};
      uint8_t round = members.stats().ranks.size();
      for (auto board_member : result.board)
      {
         if (board_member != winner)
         {
            members.set_rank(board_member, round, winner);
         }
      }
      members.set_rank(winner, round + 1, winner);
      results.set(result, contract);

      process_election_distribution(contract);
   }

   uint32_t elections::finish_round(uint32_t max_steps)
   {
      auto state = state_sing.get();
      if (auto* prev_round = std::get_if<current_election_state_active>(&state))
      {
         eosio::check(prev_round->round_end <= eosio::current_block_time(),
                      "Round has not finished yet");
         state =
             current_election_state_post_round{election_rng{adjust_seed(prev_round->saved_seed)},
                                               prev_round->round, prev_round->config, 0, 0};
      }
      else if (auto* final_round = std::get_if<current_election_state_final>(&state))
      {
         if (max_steps > 0 && final_round->seed.end_time <= eosio::current_block_time())
         {
            election_rng rng(final_round->seed.current);
            auto board = extract_board();
            std::uniform_int_distribution<uint32_t> dist(0, board.size() - 1);
            auto winner = board[dist(rng)];

            finish_election(std::move(board), winner);
            --max_steps;
         }
         return max_steps;
      }
      eosio::check(std::holds_alternative<current_election_state_post_round>(state),
                   "No round to finish now");
      auto& data = std::get<current_election_state_post_round>(state);
      auto vote_idx = vote_tb.get_index<"bygroup"_n>();
      auto group_start = vote_idx.lower_bound((data.prev_round << 16) | data.next_input_index);
      auto end = vote_idx.end();

      members members{contract};

      for (; max_steps > 0 && group_start != end && group_start->round == data.prev_round;
           --max_steps)
      {
         auto group_size = data.prev_config.group_min_size() +
                           (data.next_input_index < data.prev_config.num_large_groups() *
                                                        (data.prev_config.group_max_size()));
         auto result = finish_group(data, vote_idx, group_start, group_size);
         if (result.winner != eosio::name())
         {
            add_voter(data.rng, data.prev_round + 1, data.next_output_index, result.winner);
         }
         for (eosio::name voter : result.voted)
         {
            if (voter != result.winner)
            {
               members.set_rank(voter, data.prev_round, result.winner);
            }
         }
         for (eosio::name voter : result.missing)
         {
            if (voter != result.winner)
            {
               // FIXME: what exactly is the penalty for not voting?
               members.set_rank(voter, data.prev_round, result.winner);
            }
         }
         data.next_input_index += group_size;
      }

      if (max_steps > 0)
      {
         auto config = make_election_config(data.next_output_index);
         if (config.size() == 1)
         {
            auto now = eosio::current_time_point();
            state = current_election_state_final{
                {.start_time = now, .end_time = now + eosio::seconds(election_seeding_window)}};
         }
         else
         {
            auto g = globals.get();
            state = current_election_state_active{
                static_cast<uint8_t>(data.prev_round + 1), config.front(), data.rng.seed(),
                eosio::current_time_point() +
                    eosio::seconds(g.election_round_time_sec + g.election_break_time_sec)};
         }
         --max_steps;
      }
      state_sing.set(state, contract);
      return max_steps;
   }

   void elections::vote(uint8_t round, eosio::name voter, eosio::name candidate)
   {
      eosio::require_auth(voter);
      const auto& state = check_active();
      eosio::check(state.round == round, "Round " + std::to_string(static_cast<int>(round)) +
                                             " is not running (in round " +
                                             std::to_string(static_cast<int>(state.round)) + ")");
      auto check_member = [&](eosio::name member) -> const auto&
      {
         auto it = vote_tb.find(member.value);
         if (it == vote_tb.end() || it->round != round)
         {
            eosio::check(false, member.to_string() + " is not in round " +
                                    std::to_string(static_cast<int>(round)));
         }
         return *it;
      };
      const auto& vote = check_member(voter);
      const auto& cand = check_member(candidate);
      eosio::check(
          state.config.member_index_to_group(vote.index) ==
              state.config.member_index_to_group(cand.index),
          voter.to_string() + " and " + candidate.to_string() + " are not in the same group.");
      vote_tb.modify(vote, contract, [&](auto& row) { row.candidate = candidate; });
   }

   void elections::on_resign(eosio::name member)
   {
      eosio::check(
          !state_sing.exists() ||
              std::holds_alternative<current_election_state_pending_date>(state_sing.get()) ||
              (std::holds_alternative<current_election_state_registration>(state_sing.get()) &&
               std::get<current_election_state_registration>(state_sing.get()).start_time >
                   eosio::current_block_time()),
          "Cannot resign during an election");
      election_state_singleton global_state{contract, default_scope};
      if (global_state.exists() &&
          member == std::get<election_state_v0>(global_state.get()).lead_representative)
      {
         trigger_election();
      }
   }

   void elections::clear_all()
   {
      clear_table(vote_tb);
      state_sing.remove();
      election_state_singleton{contract, default_scope}.remove();
   }

}  // namespace eden
