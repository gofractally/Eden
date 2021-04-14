#include <token/token.hpp>

namespace token
{
   void contract::create(eosio::name issuer, const eosio::asset& maximum_supply)
   {
      require_auth(get_self());

      auto sym = maximum_supply.symbol;
      eosio::check(sym.is_valid(), "invalid symbol name");
      eosio::check(maximum_supply.is_valid(), "invalid supply");
      eosio::check(maximum_supply.amount > 0, "max-supply must be positive");

      stats statstable(get_self(), sym.code().raw());
      auto existing = statstable.find(sym.code().raw());
      eosio::check(existing == statstable.end(), "token with symbol already exists");

      statstable.emplace(get_self(), [&](auto& s) {
         s.supply.symbol = maximum_supply.symbol;
         s.max_supply = maximum_supply;
         s.issuer = issuer;
      });
   }

   void contract::issue(eosio::name to, const eosio::asset& quantity, const std::string& memo)
   {
      auto sym = quantity.symbol;
      eosio::check(sym.is_valid(), "invalid symbol name");
      eosio::check(memo.size() <= 256, "memo has more than 256 bytes");

      stats statstable(get_self(), sym.code().raw());
      auto existing = statstable.find(sym.code().raw());
      eosio::check(existing != statstable.end(),
                   "token with symbol does not exist, create token before issue");
      const auto& st = *existing;
      eosio::check(to == st.issuer, "tokens can only be issued to issuer account");

      require_auth(st.issuer);
      eosio::check(quantity.is_valid(), "invalid quantity");
      eosio::check(quantity.amount > 0, "must issue positive quantity");

      eosio::check(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
      eosio::check(quantity.amount <= st.max_supply.amount - st.supply.amount,
                   "quantity exceeds available supply");

      statstable.modify(st, eosio::same_payer, [&](auto& s) { s.supply += quantity; });

      add_balance(st.issuer, quantity, st.issuer);
   }

   void contract::retire(const eosio::asset& quantity, const std::string& memo)
   {
      auto sym = quantity.symbol;
      eosio::check(sym.is_valid(), "invalid symbol name");
      eosio::check(memo.size() <= 256, "memo has more than 256 bytes");

      stats statstable(get_self(), sym.code().raw());
      auto existing = statstable.find(sym.code().raw());
      eosio::check(existing != statstable.end(), "token with symbol does not exist");
      const auto& st = *existing;

      require_auth(st.issuer);
      eosio::check(quantity.is_valid(), "invalid quantity");
      eosio::check(quantity.amount > 0, "must retire positive quantity");

      eosio::check(quantity.symbol == st.supply.symbol, "symbol precision mismatch");

      statstable.modify(st, eosio::same_payer, [&](auto& s) { s.supply -= quantity; });

      sub_balance(st.issuer, quantity);
   }

   void contract::transfer(eosio::name from,
                           eosio::name to,
                           const eosio::asset& quantity,
                           const std::string& memo)
   {
      eosio::check(from != to, "cannot transfer to self");
      require_auth(from);
      eosio::check(is_account(to), "to account does not exist");
      auto sym = quantity.symbol.code();
      stats statstable(get_self(), sym.raw());
      const auto& st = statstable.get(sym.raw());

      require_recipient(from);
      require_recipient(to);

      eosio::check(quantity.is_valid(), "invalid quantity");
      eosio::check(quantity.amount > 0, "must transfer positive quantity");
      eosio::check(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
      eosio::check(memo.size() <= 256, "memo has more than 256 bytes");

      auto payer = has_auth(to) ? to : from;

      sub_balance(from, quantity);
      add_balance(to, quantity, payer);
   }

   void contract::sub_balance(eosio::name owner, const eosio::asset& value)
   {
      accounts from_acnts(get_self(), owner.value);

      const auto& from = from_acnts.get(value.symbol.code().raw(), "no balance object found");
      eosio::check(from.balance.amount >= value.amount, "overdrawn balance");

      from_acnts.modify(from, owner, [&](auto& a) { a.balance -= value; });
   }

   void contract::add_balance(eosio::name owner, const eosio::asset& value, eosio::name ram_payer)
   {
      accounts to_acnts(get_self(), owner.value);
      auto to = to_acnts.find(value.symbol.code().raw());
      if (to == to_acnts.end())
         to_acnts.emplace(ram_payer, [&](auto& a) { a.balance = value; });
      else
         to_acnts.modify(to, eosio::same_payer, [&](auto& a) { a.balance += value; });
   }

   void contract::open(eosio::name owner, eosio::symbol symbol, eosio::name ram_payer)
   {
      require_auth(ram_payer);

      eosio::check(is_account(owner), "owner account does not exist");

      auto sym_code_raw = symbol.code().raw();
      stats statstable(get_self(), sym_code_raw);
      const auto& st = statstable.get(sym_code_raw, "symbol does not exist");
      eosio::check(st.supply.symbol == symbol, "symbol precision mismatch");

      accounts acnts(get_self(), owner.value);
      auto it = acnts.find(sym_code_raw);
      if (it == acnts.end())
         acnts.emplace(ram_payer, [&](auto& a) { a.balance = eosio::asset{0, symbol}; });
   }

   void contract::close(eosio::name owner, eosio::symbol symbol)
   {
      require_auth(owner);
      accounts acnts(get_self(), owner.value);
      auto it = acnts.find(symbol.code().raw());
      eosio::check(it != acnts.end(),
                   "Balance row already deleted or never existed. Action won't have any effect.");
      eosio::check(it->balance.amount == 0, "Cannot close because the balance is not zero.");
      acnts.erase(it);
   }

   EOSIO_ACTION_DISPATCHER(actions)
}  // namespace token
