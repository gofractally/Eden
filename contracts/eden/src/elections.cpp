#include <bylaws.hpp>
#include <distributions.hpp>
#include <elections.hpp>
#include <eosio/crypto.hpp>
#include <eosio/ship_protocol.hpp>
#include <eosio/system.hpp>
#include <events.hpp>
#include <members.hpp>

namespace eden
{
   election_rng::election_rng(const eosio::checksum256& seed) : buf(72)
   {
      auto a = seed.extract_as_byte_array();
      memcpy(buf.data(), a.data(), a.size());
      memset(buf.data() + 32, 0, 8);
      index = 32;
   }

   election_rng::result_type election_rng::operator()()
   {
      if (index >= 32)
      {
         auto a =
             eosio::sha256(reinterpret_cast<const char*>(buf.data()), 40).extract_as_byte_array();
         memcpy(buf.data() + 40, a.data(), a.size());
         uint64_t counter;
         memcpy(&counter, buf.data() + 32, sizeof(counter));
         ++counter;
         memcpy(buf.data() + 32, &counter, sizeof(counter));
         index = 0;
      }
      result_type result;
      memcpy(&result, buf.data() + 40 + index, sizeof(result_type));
      index += sizeof(result_type);
      return result;
   }

   eosio::checksum256 election_rng::seed() const
   {
      std::array<uint8_t, 32> bytes;
      memcpy(bytes.data(), buf.data(), 32);
      return eosio::checksum256(bytes);
   }

   void election_seeder::update(eosio::input_stream& bytes)
   {
      eosio::check(bytes.remaining() >= 80, "Stream overrun");
      auto hash1 = eosio::sha256(bytes.pos, 80);
      auto hash2 = eosio::sha256(reinterpret_cast<char*>(hash1.extract_as_byte_array().data()), 32);
      // TODO: Find a saner way to implement this.  The first method I tried
      // (extract/reverse/assign) miscompiles in some environments for unknown
      // reasons.  This implementation relies on the layout of checksum256.
      std::reverse((unsigned char*)&hash2, (unsigned char*)(&hash2 + 1));
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

   uint32_t election_round_config::group_to_first_member_index(uint32_t idx) const
   {
      auto num_large = num_large_groups();
      auto min_size = group_min_size();
      auto members_in_large = (min_size + 1) * num_large;
      if (idx < num_large)
      {
         return idx * (min_size + 1);
      }
      else
      {
         return members_in_large + (idx - num_large) * min_size;
      }
   }

   void elections::set_state_sing(const current_election_state& new_value)
   {
      const auto* old_value = state_sing.get_or_null();
      if (old_value && *old_value == new_value)
         return;
      if (auto n = std::get_if<current_election_state_registration_v1>(&new_value))
      {
         push_event(election_event_schedule{.election_time = n->start_time,
                                            .election_threshold = n->election_threshold},
                    contract);
      }
      else if (auto n = std::get_if<current_election_state_seeding_v1>(&new_value))
      {
         push_event(election_event_seeding{.election_time = n->seed.end_time,
                                           .start_time = n->seed.start_time,
                                           .end_time = n->seed.end_time,
                                           .seed = n->seed.current},
                    contract);
      }
      else if (auto n = std::get_if<current_election_state_final>(&new_value))
      {
         auto election_start_time =
             std::get<election_state_v0>(election_state_singleton{contract, default_scope}.get())
                 .last_election_time;
         push_event(election_event_seeding{.election_time = election_start_time,
                                           .start_time = n->seed.start_time,
                                           .end_time = n->seed.end_time,
                                           .seed = n->seed.current},
                    contract);
      }
      state_sing.set(new_value, contract);
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
      if (auto* r = get_if_derived<current_election_state_registration_v0>(&state))
      {
         return r->start_time;
      }
      else if (auto* s = get_if_derived<current_election_state_seeding_v0>(&state))
      {
         return s->seed.end_time.to_time_point();
      }
      return {};
   }

   std::uint8_t elections::election_schedule_version()
   {
      if (!state_sing.exists())
      {
         return 1;
      }
      auto state = state_sing.get();
      if (auto* r = get_if_derived<current_election_state_registration_v0>(&state))
      {
         return r->election_schedule_version;
      }
      else if (auto* s = get_if_derived<current_election_state_seeding_v0>(&state))
      {
         return s->election_schedule_version;
      }
      else if (auto* i = get_if_derived<current_election_state_init_voters_v0>(&state))
      {
         return i->election_schedule_version;
      }
      return 1;
   }

   void elections::set_next_election_time(eosio::time_point election_time)
   {
      // TODO: The following block of code related to the July 2022 election should be removed in the next code update as it is only for a special scenario that occurs only once
      eosio::time_point_sec now = eosio::current_time_point();
      eosio::time_point_sec from_time = eosio::time_point_sec(1656547200);
      eosio::time_point_sec to_time = eosio::time_point_sec(1657324800);
      bool is_july_2022_election = from_time <= now && now < to_time;
      auto lock_time = eosio::current_time_point() + eosio::days(!is_july_2022_election ? 30 : 1);
      eosio::check(election_time >= lock_time, "New election time is too close");
      uint8_t sequence = 1;
      if (state_sing.exists())
      {
         auto state = state_sing.get();
         bool okay = false;
         if (auto r = get_if_derived<current_election_state_registration_v0>(&state))
         {
            sequence = r->election_schedule_version + 1;
            eosio::check(sequence != 0, "Integer overflow: election rescheduled too many times");
            okay = r->start_time >= lock_time;
         }
         eosio::check(okay, "Election cannot be rescheduled");
      }
      set_state_sing(
          current_election_state_registration_v1{election_time, max_active_members + 1, sequence});
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
      set_state_sing(current_election_state_registration_v1{
          get_election_time(state.election_start_time, origin_time + eosio::days(90)),
          new_threshold});
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
         set_state_sing(current_election_state_pending_date{});
      }
      else
      {
         eosio::check(state_sing.exists(), "Invariant failure: missing election state");
         // Ignore events that would trigger an election unless they move
         // the next election closer.
         auto current_state = state_sing.get();
         if (auto* current = get_if_derived<current_election_state_registration_v0>(&current_state))
         {
            auto new_start_time = eosio::block_timestamp{
                get_election_time(state.election_start_time, now + eosio::days(30))};
            if (new_start_time < current->start_time)
            {
               uint8_t sequence = current->election_schedule_version + 1;
               eosio::check(sequence != 0, "Integer overflow: election rescheduled too many times");
               set_state_sing(current_election_state_registration_v1{
                   new_start_time, max_active_members + 1, sequence});
            }
         }
      }
   }

   void elections::seed(const eosio::bytes& btc_header)
   {
      eosio::check(btc_header.data.size() == 80, "Wrong size for BTC block header");
      auto state = state_sing.get();
      if (auto* registration = get_if_derived<current_election_state_registration_v0>(&state))
      {
         auto now = eosio::current_block_time();
         eosio::block_timestamp seeding_start =
             eosio::time_point(registration->start_time) - eosio::seconds(election_seeding_window);
         eosio::check(now >= seeding_start, "Cannot start seeding yet");
         push_event(
             election_event_begin{
                 .election_time = registration->start_time,
             },
             contract);
         state = current_election_state_seeding_v1{
             {{.start_time = seeding_start, .end_time = registration->start_time.to_time_point()},
              registration->election_schedule_version}};
      }
      if (auto* seeding = get_if_derived<current_election_state_seeding_v0>(&state))
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
      set_state_sing(state);
   }

   void elections::start_election()
   {
      auto old_state_variant = state_sing.get();
      auto old_state_ptr = get_if_derived<current_election_state_seeding_v0>(&old_state_variant);
      eosio::check(old_state_ptr != nullptr, "Election seed not set");
      auto& old_state = *old_state_ptr;
      auto election_start_time = old_state.seed.end_time.to_time_point();
      eosio::check(eosio::current_block_time() >= old_state.seed.end_time,
                   "Seeding window is still open");
      set_state_sing(current_election_state_init_voters_v1{
          0, election_rng{old_state.seed.current}, {}, 0, old_state.election_schedule_version});
      push_event(election_event_end_seeding{.election_time = election_start_time}, contract);

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

   uint32_t elections::randomize_voters(current_election_state_init_voters_v0& state,
                                        uint32_t max_steps)
   {
      members members(contract);
      const auto& member_tb = members.get_table();
      auto iter = member_tb.upper_bound(state.last_processed.value);
      auto end = member_tb.end();
      for (; max_steps > 0 && iter != end; --max_steps)
      {
         if (iter->status() == member_status::active_member)
         {
            if (iter->election_participation_status() == state.election_schedule_version)
            {
               add_voter(state.rng, 0, state.next_member_idx, iter->account());
            }
            else
            {
               members.set_rank(iter->account(), 0, eosio::name(-1));
            }
         }
         state.last_processed = iter->account();
         ++iter;
      }
      return max_steps;
   }

   template <typename It>
   static void report_create_group(uint8_t round,
                                   eosio::name contract,
                                   It& iter,
                                   uint8_t group_size,
                                   eosio::block_timestamp election_start)
   {
      std::vector<eosio::name> voters;
      for (uint32_t i = 0; i < group_size; ++i)
      {
         voters.push_back(iter->member);
         ++iter;
      }
      push_event(
          election_event_create_group{
              .election_time = election_start,
              .round = round,
              .voters = voters,
          },
          contract);
   }

   uint32_t elections::prepare_election(uint32_t max_steps)
   {
      auto state_variant = state_sing.get();
      if (auto* state = get_if_derived<current_election_state_seeding_v0>(&state_variant))
      {
         if (max_steps == 0)
         {
            return max_steps;
         }
         start_election();
         state_variant = state_sing.get();
         --max_steps;
      }
      if (auto* state = get_if_derived<current_election_state_init_voters_v0>(&state_variant))
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
            auto election_start_time =
                std::get<election_state_v0>(election_state_singleton{contract, default_scope}.get())
                    .last_election_time;
            auto configs = make_election_config(state->next_member_idx);
            if (max_steps > 0 && !state->next_report_index)
            {
               push_event(
                   election_event_config_summary{
                       .election_time = election_start_time,
                       .num_rounds = (uint8_t)configs.size(),
                       .num_participants = configs.front().num_participants,
                   },
                   contract);
               push_event(
                   election_event_create_round{
                       .election_time = election_start_time,
                       .round = 0,
                       .requires_voting = configs.size() > 1,
                       .num_participants = configs.front().num_participants,
                       .num_groups = configs.front().num_groups,
                   },
                   contract);
            }

            auto vote_idx = vote_tb.get_index<"bygroup"_n>();
            auto end = vote_idx.end();
            auto group_start = vote_idx.lower_bound(state->next_report_index);
            for (; max_steps > 0 && group_start != end; --max_steps)
            {
               auto group_size = configs.front().group_min_size() +
                                 (state->next_report_index < configs.front().num_large_groups() *
                                                                 configs.front().group_max_size());
               report_create_group(0, contract, group_start, group_size, election_start_time);
               state->next_report_index += group_size;
            }

            if (max_steps > 0)
            {
               push_event(
                   election_event_begin_round_voting{
                       .election_time = election_start_time,
                       .round = 0,
                       .voting_begin = eosio::current_time_point(),
                       .voting_end =
                           eosio::current_time_point() +
                           eosio::seconds(configs.size() > 1 ? globals.get().election_round_time_sec
                                                             : 0),
                   },
                   contract);
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
                          eosio::seconds(globals.get().election_round_time_sec)};
               }
               --max_steps;
            }
         }
      }
      set_state_sing(state_variant);
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
                                    uint8_t group_size,
                                    eosio::block_timestamp election_start)
   {
      // count votes
      group_result result{eosio::name{~iter->member.value}};
      std::vector<vote_report> votes;
      std::map<eosio::name, uint8_t> votes_by_candidate;
      uint8_t total_votes = 0;
      for (uint32_t i = 0; i < group_size; ++i)
      {
         votes.push_back({iter->member, iter->candidate});
         if (iter->candidate != eosio::name())
         {
            if (iter->candidate == iter->member)
            {
               votes_by_candidate[iter->candidate] += group_size;
            }
            ++votes_by_candidate[iter->candidate];
            ++total_votes;
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
      if (!votes_by_candidate.empty() && 3 * best->second > (2 * total_votes + 3 * group_size))
      {
         result.winner = best->first;
      }
      auto contract = group_idx.get_code();
      push_event(
          election_event_report_group{
              .election_time = election_start,
              .round = state.prev_round,
              .winner = result.winner,
              .votes = votes,
          },
          contract);
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

   void elections::set_board_permission(const std::vector<eosio::name>& board)
   {
      eosio::ship_protocol::authority auth{.threshold = board.size() * 2 / 3 + 1};
      if (board.empty())
      {
         auth.accounts.push_back({{contract, "active"_n}, 1});
      }
      for (eosio::name member : board)
      {
         auth.accounts.push_back({{member, "active"_n}, 1});
      }
      std::sort(auth.accounts.begin(), auth.accounts.end(), [](const auto& lhs, const auto& rhs) {
         return lhs.permission.actor < rhs.permission.actor;
      });
      eosio::action{{contract, "active"_n},
                    "eosio"_n,
                    "updateauth"_n,
                    std::tuple(contract, "board.major"_n, "active"_n, auth)}
          .send();
      auth.threshold = auth.accounts.size() + 1 - auth.threshold;
      eosio::action{{contract, "active"_n},
                    "eosio"_n,
                    "updateauth"_n,
                    std::tuple(contract, "board.minor"_n, "active"_n, auth)}
          .send();
   }

   void elections::link_board_permission()
   {
      eosio::action{{contract, "active"_n},
                    "eosio"_n,
                    "linkauth"_n,
                    std::tuple(contract, contract, "rename"_n, "board.major"_n)}
          .send();
   }

   void elections::finish_election(std::vector<eosio::name>&& board, eosio::name winner)
   {
      election_state_singleton results(contract, default_scope);
      auto result = std::get<election_state_v0>(results.get());
      result.lead_representative = winner;
      result.board = std::move(board);
      members members{contract};
      uint8_t round = members.stats().ranks.size();
      std::vector<vote_report> votes;
      for (auto board_member : result.board)
      {
         votes.push_back({board_member, {}});
         if (board_member != winner)
         {
            members.set_rank(board_member, round, winner);
         }
      }
      members.set_rank(winner, round + 1, winner);
      results.set(result, contract);

      process_election_distribution(contract);
      set_board_permission(result.board);

      auto election_start_time =
          std::get<election_state_v0>(election_state_singleton{contract, default_scope}.get())
              .last_election_time;
      if (round)
         push_event(
             election_event_end_seeding{
                 .election_time = election_start_time,
             },
             contract);
      push_event(
          election_event_end_round_voting{
              .election_time = election_start_time,
              .round = round,
          },
          contract);
      push_event(
          election_event_report_group{
              .election_time = election_start_time,
              .round = round,
              .winner = winner,
              .votes = votes,
          },
          contract);
      push_event(
          election_event_end_round{
              .election_time = election_start_time,
              .round = round,
          },
          contract);
      push_event(
          election_event_end{
              .election_time = election_start_time,
          },
          contract);

      set_default_election(result.last_election_time.to_time_point());
   }

   uint32_t elections::finish_round(uint32_t max_steps)
   {
      if (!state_sing.exists())
      {
         return max_steps;
      }
      auto state = state_sing.get();
      auto election_start_time =
          std::get<election_state_v0>(election_state_singleton{contract, default_scope}.get())
              .last_election_time;

      if (auto* prev_round = std::get_if<current_election_state_active>(&state))
      {
         if (eosio::current_block_time() < prev_round->round_end)
         {
            return max_steps;
         }
         push_event(
             election_event_end_round_voting{
                 .election_time = election_start_time,
                 .round = prev_round->round,
             },
             contract);
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
      if (!std::holds_alternative<current_election_state_post_round>(state))
      {
         return max_steps;
      }
      auto& data = std::get<current_election_state_post_round>(state);
      auto vote_idx = vote_tb.get_index<"bygroup"_n>();
      auto group_start = vote_idx.lower_bound((data.prev_round << 16) | data.next_input_index);
      auto end = vote_idx.end();

      members members{contract};
      encrypt encrypt{contract, "election"_n};

      for (; max_steps > 0 && group_start != end && group_start->round == data.prev_round;
           --max_steps)
      {
         auto group_size = data.prev_config.group_min_size() +
                           (data.next_input_index < data.prev_config.num_large_groups() *
                                                        (data.prev_config.group_max_size()));
         encrypt.erase((data.prev_round << 16) |
                       data.prev_config.member_index_to_group(group_start->index));
         auto result = finish_group(data, vote_idx, group_start, group_size, election_start_time);
         if ((result.winner.value & 0xFull) == 0)
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

      auto config = make_election_config(data.next_output_index);
      uint8_t next_round = data.prev_round + 1;
      if (max_steps > 0 && !data.next_report_index)
      {
         push_event(
             election_event_end_round{
                 .election_time = election_start_time,
                 .round = data.prev_round,
             },
             contract);
         push_event(
             election_event_create_round{
                 .election_time = election_start_time,
                 .round = next_round,
                 .requires_voting = config.size() > 1,
                 .num_participants = config.front().num_participants,
                 .num_groups = config.front().num_groups,
             },
             contract);
      }

      group_start = vote_idx.lower_bound((next_round << 16) | data.next_report_index);
      for (; max_steps > 0 && group_start != end; --max_steps)
      {
         auto group_size = config.front().group_min_size() +
                           (data.next_report_index <
                            config.front().num_large_groups() * config.front().group_max_size());
         report_create_group(next_round, contract, group_start, group_size, election_start_time);
         data.next_report_index += group_size;
      }

      if (max_steps > 0)
      {
         push_event(
             election_event_begin_round_voting{
                 .election_time = election_start_time,
                 .round = next_round,
                 .voting_begin = eosio::current_time_point(),
                 .voting_end =
                     eosio::current_time_point() +
                     eosio::seconds(config.size() == 1 ? election_final_seeding_window
                                                       : globals.get().election_round_time_sec),
             },
             contract);
         if (config.size() == 1)
         {
            auto now = eosio::current_time_point();
            state = current_election_state_final{
                {.start_time = now,
                 .end_time = now + eosio::seconds(election_final_seeding_window)}};
         }
         else
         {
            auto g = globals.get();
            state = current_election_state_active{
                static_cast<uint8_t>(data.prev_round + 1), config.front(), data.rng.seed(),
                eosio::current_time_point() + eosio::seconds(g.election_round_time_sec)};
         }
         --max_steps;
      }
      set_state_sing(state);
      return max_steps;
   }

   void elections::vote(uint8_t round, eosio::name voter, eosio::name candidate)
   {
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

   bool elections::remove_from_board(eosio::name member)
   {
      election_state_singleton global_state{contract, default_scope};
      if (!global_state.exists())
      {
         return false;
      }
      auto value = std::get<election_state_v0>(global_state.get());
      auto pos = std::find(value.board.begin(), value.board.end(), member);
      if (pos != value.board.end())
      {
         value.board.erase(pos);
         global_state.set(value, contract);
         set_board_permission(value.board);
      }
      if (member == value.lead_representative)
      {
         value.lead_representative = eosio::name();
         return true;
      }
      return false;
   }

   static bool is_election_running(current_election_state_singleton& state_sing)
   {
      if (!state_sing.exists())
      {
         return false;
      }
      auto state = state_sing.get();
      if (std::holds_alternative<current_election_state_pending_date>(state_sing.get()))
      {
         return false;
      }
      if (auto* r = get_if_derived<current_election_state_registration_v0>(&state))
      {
         return eosio::current_block_time() >= r->start_time;
      }
      return true;
   }

   void elections::on_resign(eosio::name member)
   {
      eosio::check(!is_election_running(state_sing), "Cannot resign during an election");
      if (remove_from_board(member))
      {
         trigger_election();
      }
   }

   void elections::on_rename(eosio::name old_account, eosio::name new_account)
   {
      eosio::check(!is_election_running(state_sing), "Cannot rename account during an election");

      // Update the board
      election_state_singleton global_state{contract, default_scope};
      if (!global_state.exists())
      {
         return;
      }
      auto value = std::get<election_state_v0>(global_state.get());
      auto pos = std::find(value.board.begin(), value.board.end(), old_account);
      if (pos != value.board.end())
      {
         *pos = new_account;
         global_state.set(value, contract);
         set_board_permission(value.board);
      }
      if (old_account == value.lead_representative)
      {
         value.lead_representative = new_account;
         global_state.set(value, contract);
      }
   }

   boost::logic::tribool elections::can_upload_video(uint8_t round, eosio::name voter)
   {
      auto iter = vote_tb.find(voter.value);
      if (iter == vote_tb.end())
      {
         auto current_state = state_sing.get();
         bool valid_state = !get_if_derived<current_election_state_init_voters_v0>(&current_state);
         election_state_singleton state{contract, default_scope};
         auto end_time =
             std::get<election_state_v0>(state.get()).last_election_time.to_time_point() +
             eosio::days(14);
         return valid_state && eosio::current_time_point() <= end_time &&
                boost::logic::tribool(boost::logic::indeterminate);
      }
      else
      {
         return iter->round >= round;
      }
   }

   uint64_t elections::get_group_id(eosio::name voter, uint8_t round)
   {
      const auto& state = check_active();
      eosio::check(round == state.round, "Wrong round");
      const auto& vote = vote_tb.get(voter.value);
      eosio::check(vote.round == state.round, "Invariant failure: round mismatch");
      return static_cast<uint64_t>(round << 16) | state.config.member_index_to_group(vote.index);
   }

   std::vector<eosio::name> elections::get_group_members(uint64_t group_id)
   {
      const auto& state = check_active();
      auto round = group_id >> 16;
      auto group = group_id & 0xFFFFu;
      auto vote_idx = vote_tb.get_index<"bygroup"_n>();
      std::vector<eosio::name> result;
      auto iter =
          vote_idx.lower_bound((round << 16) | state.config.group_to_first_member_index(group));
      auto end = vote_idx.end();
      for (; iter != end && state.config.member_index_to_group(iter->index) == group; ++iter)
      {
         result.push_back(iter->member);
      }
      return result;
   }

   void elections::clear_all()
   {
      clear_table(vote_tb);
      clear_singleton(state_sing, contract);
      election_state_singleton state{contract, default_scope};
      clear_singleton(state, contract);
   }

}  // namespace eden
