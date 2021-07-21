#ifdef ENABLE_SET_TABLE_ROWS

#include <boost/mp11/algorithm.hpp>
#include <boost/mp11/bind.hpp>
#include <eden.hpp>
#include <experimental/type_traits>

namespace eden
{
   template <typename Table>
   struct get_value_type;
   template <eosio::name::raw TableName, typename T, typename... Indices>
   struct get_value_type<eosio::multi_index<TableName, T, Indices...>&>
   {
      using type = T;
   };
   template <eosio::name::raw TableName, typename T>
   struct get_value_type<eosio::singleton<TableName, T>&>
   {
      using type = T;
   };

   template <typename Table, typename T>
   using is_in_table_impl = decltype(typename get_value_type<Table>::type{std::declval<T>()});

   using test1 = is_in_table_impl<account_table_type&, account_v0>;

   template <typename Table, typename T>
   using is_in_table = std::experimental::is_detected<is_in_table_impl, Table, T>;

   template <typename T, eosio::name::raw N, typename R>
   void set_table_row(eosio::name contract, const T& row, eosio::singleton<N, R>& table)
   {
      table.set(row, contract);
   }

   template <typename R, eosio::name::raw TableName, typename T, typename... Indices>
   void set_table_row(eosio::name contract,
                      const R& row,
                      eosio::multi_index<TableName, T, Indices...>& table)
   {
      T new_value{row};
      if (auto iter = table.find(new_value.primary_key()); iter != table.end())
      {
         table.modify(iter, contract, [&](auto& value) { value = new_value; });
      }
      else
      {
         table.emplace(contract, [&](auto& value) { value = new_value; });
      }
   }

   template <typename T, typename... Tables>
   void set_table_row(eosio::name contract, const T& row, std::tuple<Tables...>& tables)
   {
      constexpr auto index =
          boost::mp11::mp_find_if_q<std::tuple<Tables...>,
                                    boost::mp11::mp_bind_back<is_in_table, T>>::value;
      set_table_row(contract, row, std::get<index>(tables));
   }

   void eden::settablerows(eosio::name scope, const std::vector<table_variant>& rows)
   {
      eosio::require_auth(get_self());
      account_table_type account_tb{get_self(), scope.value};
      auction_table_type auction_tb{get_self(), scope.value};
      bylaws_table_type bylaws_tb{get_self(), scope.value};
      distribution_account_table_type distribution_account_tb{get_self(), scope.value};
      distribution_table_type distribution_tb{get_self(), scope.value};
      endorsement_table_type endorsement_tb{get_self(), scope.value};
      current_election_state_singleton current_election_state_tb{get_self(), scope.value};
      election_state_singleton election_state_tb{get_self(), scope.value};
      global_singleton global_tb{get_self(), scope.value};
      induction_table_type induction_tb{get_self(), scope.value};
      member_table_type member_tb{get_self(), scope.value};
      member_stats_singleton member_stats_tb{get_self(), scope.value};
      migration_singleton migration_tb{get_self(), scope.value};
      pool_table_type pool_tb{get_self(), scope.value};
      vote_table_type vote_tb{get_self(), scope.value};
      encrypted_data_table_type encrypted_data_tb{get_self(), scope.value};
      auto all_tables = std::tie(
          account_tb, auction_tb, bylaws_tb, distribution_account_tb, distribution_tb,
          endorsement_tb, current_election_state_tb, election_state_tb, global_tb, induction_tb,
          member_tb, member_stats_tb, migration_tb, pool_tb, vote_tb, encrypted_data_tb);
      for (const auto& row : rows)
      {
         return std::visit([&](const auto& value) { set_table_row(get_self(), value, all_tables); },
                           row);
      }
   }
}  // namespace eden

#endif
