#include <accounts.hpp>
#include <distributions.hpp>
#include <eden.hpp>
#include <members.hpp>
#include <migrations.hpp>
#include <token/token.hpp>

namespace eden
{
   static bool is_possible_deposit_account(eosio::name account)
   {
      constexpr auto eosio_prefix = "eosio"_n;
      constexpr auto eosio_mask = 0xFFFFFFFC00000000;
      return account != atomic_market_account && account != atomic_assets_account &&
             (account.value & eosio_mask) != eosio_prefix.value;
   }

   void eden::notify_transfer(eosio::name from,
                              eosio::name to,
                              const eosio::asset& quantity,
                              std::string memo)
   {
      if (from == get_self())
      {
         accounts{get_self(), "outgoing"_n}.sub_balance(to, quantity);
         return;
      }

      if (to != get_self())
         return;

      globals globals{get_self()};
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());

      migrations migrations{get_self()};

      if (is_possible_deposit_account(from))
      {
         accounts{get_self()}.add_balance(from, quantity);
         if (auto migration = migrations.get<migrate_account_v0>())
         {
            migration->adjust_balance(from, quantity);
            migrations.set(*migration);
         }
      }
      else if (migrations.is_completed<migrate_account_v0>())
      {
         add_to_pool(get_self(), "master"_n, quantity);
      }
   }

   void eden::transfer(eosio::name to, const eosio::asset& quantity, const std::string& memo)
   {
      require_auth(get_self());
      accounts internal{get_self(), "owned"_n};
      setup_distribution(get_self(), internal);
      internal.sub_balance("master"_n, quantity);
      accounts{get_self(), "outgoing"_n}.add_balance(to, quantity);
      eosio::action{{get_self(), "active"_n},
                    token_contract,
                    "transfer"_n,
                    std::tuple(get_self(), to, quantity, memo)}
          .send();
   }

   void eden::withdraw(eosio::name owner, const eosio::asset& quantity)
   {
      require_auth(owner);

      globals globals{get_self()};
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());

      accounts{get_self()}.sub_balance(owner, quantity);
      migrations migrations{get_self()};
      if (auto migration = migrations.get<migrate_account_v0>())
      {
         migration->adjust_balance(owner, -quantity);
         migrations.set(*migration);
      }
      accounts{get_self(), "outgoing"_n}.add_balance(owner, quantity);
      token::actions::transfer{token_contract, get_self()}.send(  //
          get_self(), owner, quantity, "withdraw");
   }

   void eden::donate(eosio::name owner, const eosio::asset& quantity)
   {
      require_auth(owner);

      globals globals{get_self()};
      eosio::check(quantity.symbol == globals.default_token(),
                   "token must be a valid " + globals.default_token().to_string());
      eosio::check(quantity.amount > 0, "Donation must be positive");
      eosio::check(migrations{get_self()}.is_completed<migrate_account_v0>(),
                   "Tables must be migrated to enable donations");
      accounts{get_self()}.sub_balance(owner, quantity);
      add_to_pool(get_self(), "master"_n, quantity);
   }

   void eden::distribute(uint32_t max_steps)
   {
      eosio::check(distribute_monthly(get_self(), max_steps) != max_steps, "Nothing to do");
   }

   void eden::fundtransfer(eosio::name from,
                           eosio::block_timestamp distribution_time,
                           uint8_t rank,
                           eosio::name to,
                           eosio::asset amount,
                           const std::string& memo)
   {
      eosio::check(amount.amount > 0, "amount must be positive");
      eosio::check(memo.size() <= 256, "Memo has more than 256 bytes");
      eosio::require_auth(from);
      members members{get_self()};
      members.check_active_member(from);
      members.check_active_member(to);
      distributions distributions{get_self()};
      accounts accounts{get_self()};
      distributions.sub_balance(from, distribution_time, rank, amount);
      accounts.add_balance(to, amount);
   }

   void eden::usertransfer(eosio::name from,
                           eosio::name to,
                           eosio::asset amount,
                           const std::string& memo)
   {
      eosio::check(amount.amount > 0, "amount must be positive");
      eosio::check(memo.size() <= 256, "Memo has more than 256 bytes");
      eosio::require_auth(from);
      members members{get_self()};
      members.check_active_member(from);
      members.check_active_member(to);
      accounts accounts{get_self()};
      accounts.sub_balance(from, amount);
      accounts.add_balance(to, amount);
   }

}  // namespace eden
