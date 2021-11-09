#include <eden.hpp>
#include <members.hpp>

namespace eden
{
   void expire(session_container& sc)
   {
      auto now = eosio::current_block_time();
      auto& sessions = sc.sessions();
      auto new_end = std::remove_if(sessions.begin(), sessions.end(),
                                    [&](auto& session) { return session.expiration <= now; });
      sessions.erase(new_end, sessions.end());

      auto expiration = eosio::block_timestamp::max();
      for (auto& session : sessions)
         expiration = std::min(expiration, session.expiration);
      sc.earliest_expiration() = expiration;
   }

   uint32_t gc_sessions(eosio::name contract, uint32_t remaining)
   {
      auto now = eosio::current_block_time();
      sessions_table_type table(contract, default_scope);
      auto idx = table.get_index<"byexpiration"_n>();
      while (remaining && idx.begin() != idx.end() && idx.begin()->earliest_expiration() <= now)
      {
         auto& sc = *idx.begin();
         table.modify(sc, contract, [&](auto& sc) { expire(sc); });
         if (sc.sessions().empty())
            table.erase(sc);
         --remaining;
      }
      return remaining;
   }

   void eden::newsession(eosio::name eden_account,
                         const eosio::public_key& key,
                         eosio::block_timestamp expiration,
                         const std::string& description)
   {
      eosio::require_auth(eden_account);
      eosio::check(key.index() < 2, "unsupported key type");
      eosio::check(expiration > eosio::current_block_time(), "session is expired");
      eosio::check(expiration <= eosio::current_block_time().to_time_point() + eosio::days(90),
                   "expiration is too far in the future");
      eosio::check(description.size() <= 20, "description is too long");
      members(get_self()).get_member(eden_account);

      sessions_table_type table(get_self(), default_scope);
      auto sc = table.find(eden_account.value);
      if (sc == table.end())
      {
         table.emplace(get_self(), [&](auto& sc) {
            sc.eden_account() = eden_account;
            sc.earliest_expiration() = expiration;
            sc.sessions().push_back(session_v0{
                .key = key,
                .expiration = expiration,
                .description = description,
            });
         });
      }
      else
      {
         table.modify(sc, get_self(), [&](auto& sc) {
            auto& sessions = sc.sessions();
            auto session = std::find_if(sessions.begin(), sessions.end(),
                                        [&](auto& session) { return session.key == key; });
            eosio::check(session == sessions.end(), "session key already exists");
            sessions.push_back(session_v0{
                .key = key,
                .expiration = expiration,
                .description = description,
            });
            if (sessions.size() > 4)
               sessions.erase(sessions.begin());
            expire(sc);  // also sets earliest_expiration
         });
      }
   }  // eden::newsession

   void eden::delsession(const eosio::excluded_arg<auth_info>& auth,
                         eosio::name eden_account,
                         const eosio::public_key& key)
   {
      auth.value.require_auth(eden_account);
      sessions_table_type table(get_self(), default_scope);
      auto sc = table.find(eden_account.value);
      eosio::check(sc != table.end(), "Session key is either expired or not found");
      bool empty = false;
      table.modify(sc, get_self(), [&](auto& sc) {
         auto& sessions = sc.sessions();
         auto session = std::find_if(sessions.begin(), sessions.end(),
                                     [&](auto& session) { return session.key == key; });
         eosio::check(session != sessions.end(), "Session key is either expired or not found");
         sessions.erase(session);
         expire(sc);  // also sets earliest_expiration
         empty = sessions.empty();
      });
      if (empty)
         table.erase(sc);
   }  // eden::delsession

   void eden::runactions(const eosio::signature& signature,
                         eosio::ignore<eosio::name>,
                         eosio::ignore<eosio::varuint32>,
                         eosio::ignore<std::vector<action>>)
   {
      auto& ds = get_datastream();
      auto digest = eosio::sha256(ds.pos(), ds.remaining());
      auto recovered = eosio::recover_key(digest, signature);

      eosio::name eden_account;
      eosio::varuint32 sequence;
      ds >> eden_account;
      ds >> sequence;

      sessions_table_type table(get_self(), default_scope);
      auto sc = table.find(eden_account.value);
      if (sc == table.end())
         eosio::check(false, "Recovered session key " + public_key_to_string(recovered) +
                                 " is either expired or not found");
      table.modify(sc, get_self(), [&](auto& sc) {
         expire(sc);
         auto& sessions = sc.sessions();
         auto session = std::find_if(sessions.begin(), sessions.end(),
                                     [&](auto& session) { return session.key == recovered; });
         if (session == sessions.end())
            eosio::check(false, "Recovered session key " + public_key_to_string(recovered) +
                                    " is either expired or not found");

         auto& sequences = session->sequences;
         if (sequences.begin() != sequences.end())
         {
            if (sequence.value < *sequences.begin())
               eosio::check(false, "received duplicate sequence " + std::to_string(sequence.value));
            else if (sequence.value > sequences.end()[-1].value + 10)
               eosio::check(false,
                            "sequence " + std::to_string(sequence.value) + " skips too many");
         }
         else if (sequence.value > 10)
            eosio::check(false, "sequence " + std::to_string(sequence.value) + " skips too many");
         auto it = std::lower_bound(sequences.begin(), sequences.end(), sequence);
         if (it != sequences.end() && *it == sequence)
            eosio::check(false, "received duplicate sequence " + std::to_string(sequence.value));
         sequences.insert(it, sequence);
         if (sequences.size() > 20)
            sequences.erase(sequences.begin());
      });

      eosio::excluded_arg<auth_info> auth;
      auth.value.authorized_eden_account = eden_account;

      eosio::varuint32 num_actions;
      ds >> num_actions;
      eosio::check(num_actions.value > 0, "actions is empty");
      for (uint32_t i = 0; i < num_actions.value; ++i)
      {
         eosio::varuint32 index;
         ds >> index;
         eosio::check(actions::dispatch_auth(get_self(), index.value, auth, ds),
                      "unsupported action index");
      }

      eosio::check(!ds.remaining(), "detected extra action data");
   }  // eden::runactions
}  // namespace eden
