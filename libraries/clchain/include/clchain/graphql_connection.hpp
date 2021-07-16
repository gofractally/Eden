#pragma once

#include <clchain/graphql.hpp>
#include <eosio/from_bin.hpp>
#include <eosio/to_bin.hpp>

namespace clchain
{
   struct PageInfo
   {
      bool hasPreviousPage = false;
      bool hasNextPage = false;
      std::string startCursor;
      std::string endCursor;
   };
   EOSIO_REFLECT2(PageInfo, hasPreviousPage, hasNextPage, startCursor, endCursor)

   template <typename T, const char* ConnectionName, const char* EdgeName>
   struct ConnectionConfig
   {
      using value_type = T;
      static constexpr const char* connection_name = ConnectionName;
      static constexpr const char* edge_name = EdgeName;
   };

   template <typename Config>
   struct Edge
   {
      using config = Config;

      typename Config::value_type node;
      std::string cursor;
   };
   template <typename Config>
   [[maybe_unused]] inline const char* get_type_name(Edge<Config>*)
   {
      return Config::edge_name;
   }
   template <typename Config, typename F>
   constexpr void eosio_for_each_field(Edge<Config>*, F f)
   {
      EOSIO_REFLECT2_FOR_EACH_FIELD(Edge<Config>, node, cursor)
   }

   template <typename Config>
   struct Connection
   {
      using config = Config;

      std::vector<Edge<Config>> edges;
      PageInfo pageInfo;
   };
   template <typename Config>
   [[maybe_unused]] inline const char* get_type_name(Connection<Config>*)
   {
      return Config::connection_name;
   }
   template <typename Config, typename F>
   constexpr void eosio_for_each_field(Connection<Config>*, F f)
   {
      EOSIO_REFLECT2_FOR_EACH_FIELD(Connection<Config>, edges, pageInfo)
   }

   template <typename Connection, typename Key, typename T, typename To_key, typename To_node>
   Connection firstAfter(std::optional<int32_t> first,
                         const std::optional<std::string>& after,
                         const T& container,
                         To_key&& to_key,
                         To_node&& to_node)
   {
      auto it = container.begin();
      if (after && !after->empty())
      {
         std::vector<char> bytes;
         if (eosio::unhex(std::back_inserter(bytes), after->begin(), after->end()))
         {
            // TODO: prevent from_bin aborting
            auto key = eosio::convert_from_bin<Key>(bytes);
            it = container.upper_bound(key);
         }
      }
      Connection result;
      result.pageInfo.hasPreviousPage = it != container.begin();
      for (; it != container.end() && (!first || (*first)-- > 0); ++it)
      {
         auto bin = eosio::convert_to_bin(to_key(*it));
         auto cursor = eosio::hex(bin.begin(), bin.end());
         if (result.pageInfo.startCursor.empty())
            result.pageInfo.startCursor = cursor;
         result.edges.push_back(Edge<typename Connection::config>{to_node(*it), cursor});
         result.pageInfo.endCursor = std::move(cursor);
      }
      result.pageInfo.hasNextPage = it != container.end();
      return result;
   }
}  // namespace clchain
