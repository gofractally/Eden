#include <members.hpp>

namespace eden
{
   void members::deposit(const eosio::name account, const eosio::asset& quantity)
   {
      eosio::check(quantity >= minimum_membership_donation, "insufficient minimum donation");
      if (is_new_member(account))
      {
         create(account);
      }
   }

   bool members::is_new_member(const eosio::name account) const
   {
      auto itr = member_tb.find(account.value);
      return itr == member_tb.end();
   }

   void members::create(const eosio::name account)
   {
      member_tb.emplace(contract, [&](auto& row) {
         row.account = account;
         row.status = member_status::pending_membership;
         row.nft_template_id = 0;
      });
   }
}  // namespace eden
