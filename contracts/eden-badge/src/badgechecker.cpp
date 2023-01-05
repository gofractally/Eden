#include <badgechecker.hpp>

namespace eden
{
   void contract::check_authorization(eosio::name action, eosio::name badge, eosio::name authorizer)
   {
      permission_table_type permission_tb(get_self(), action.value);
      auto itr = permission_tb.find(badge.value);

      eosio::check(itr != permission_tb.end(),
                   "Badge is pending to be configured with permissions");

      bool is_account_authorized =
          std::any_of(itr->accounts().begin(), itr->accounts().end(),
                      [&](eosio::name temp_acc) { return temp_acc == authorizer; });

      eosio::check(is_account_authorized, "Action denied: missing permission");
   }

   void contract::notify_initsimple(eosio::name org,
                                    eosio::name creator,
                                    eosio::name badge,
                                    std::vector<eosio::name> parent_badges,
                                    std::string offchain_lookup_data,
                                    std::string onchain_lookup_data,
                                    std::vector<eosio::name> consumers,
                                    std::string memo)
   {
      if (!eosio::has_auth(org))
      {
         check_authorization("initsimple"_n, badge, creator);
      }
   }

   void contract::notify_givesimple(eosio::name org,
                                    eosio::name badge,
                                    eosio::name authorizer,
                                    eosio::name to,
                                    std::string memo)
   {
      if (!eosio::has_auth(org))
      {
         check_authorization("givesimple"_n, badge, authorizer);
      }
   }

   void contract::setauth(eosio::name action, eosio::name badge, std::vector<eosio::name> accounts)
   {
      require_auth(eden_account);

      bool is_valid_action = std::any_of(allowed_actions.begin(), allowed_actions.end(),
                                         [&](eosio::name temp_act) { return temp_act == action; });

      eosio::check(is_valid_action, "Action " + action.to_string() +
                                        " is not allowed by: " + eden_account.to_string());
      eosio::check(accounts.size() <= max_accounts, "An action can only have a maximum of " +
                                                        std::to_string(max_accounts) + " accounts");

      permission_table_type permission_tb(get_self(), action.value);
      auto itr = permission_tb.find(badge.value);

      if (itr == permission_tb.end())
      {
         permission_tb.emplace(eden_account,
                               [&](auto& row)
                               {
                                  row.badge() = badge;
                                  row.accounts() = accounts;
                               });
      }
      else
      {
         permission_tb.modify(itr, eosio::same_payer,
                              [&](auto& row) { row.accounts() = accounts; });
      }
   }
}  // namespace eden

EOSIO_ACTION_DISPATCHER(eden::actions)
EOSIO_ABIGEN(actions(eden::actions), table("permission"_n, eden::permission_variant))