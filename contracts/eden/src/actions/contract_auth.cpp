#include <eden.hpp>

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
      eosio::check(sc != table.end(), "User has no session keys");
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

      eosio::check(!ds.remaining(), "detected extra action data after post");

   }  // eden::runactions
}  // namespace eden
