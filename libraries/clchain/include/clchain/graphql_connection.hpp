#pragma once

#include <clchain/graphql.hpp>
#include <eosio/from_bin.hpp>
#include <eosio/reflection2.hpp>
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

   // To enable cursors to function correctly, container must not have duplicate keys
   template <typename Connection,
             typename Key,
             typename T,
             typename To_key,
             typename To_node,
             typename Lower_bound,
             typename Upper_bound>
   Connection make_connection(const std::optional<Key>& gt,
                              const std::optional<Key>& ge,
                              const std::optional<Key>& lt,
                              const std::optional<Key>& le,
                              std::optional<uint32_t> first,
                              std::optional<uint32_t> last,
                              const std::optional<std::string>& before,
                              const std::optional<std::string>& after,
                              const T& container,
                              To_key&& to_key,
                              To_node&& to_node,
                              Lower_bound&& lower_bound,
                              Upper_bound&& upper_bound)
   {
      auto compare_it = [&](const auto& a, const auto& b) {
         if (a == container.end())
            return false;
         if (b == container.end())
            return true;
         return to_key(*a) < to_key(*b);
      };
      auto key_from_hex = [&](const std::optional<std::string>& s) -> std::optional<Key> {
         if (!s || s->empty())
            return {};
         // TODO: prevent from_bin aborting
         std::vector<char> bytes;
         bytes.reserve(s->size() / 2);
         if (eosio::unhex(std::back_inserter(bytes), s->begin(), s->end()))
            return eosio::convert_from_bin<Key>(bytes);
         return {};
      };

      auto rangeBegin = container.begin();
      auto rangeEnd = container.end();
      if (ge)
         rangeBegin = std::max(rangeBegin, lower_bound(container, *ge), compare_it);
      if (gt)
         rangeBegin = std::max(rangeBegin, upper_bound(container, *gt), compare_it);
      if (le)
         rangeEnd = std::min(rangeEnd, upper_bound(container, *le), compare_it);
      if (lt)
         rangeEnd = std::min(rangeEnd, lower_bound(container, *lt), compare_it);
      rangeEnd = std::max(rangeBegin, rangeEnd, compare_it);

      auto it = rangeBegin;
      auto end = rangeEnd;
      if (auto key = key_from_hex(after))
         it = std::clamp(upper_bound(container, *key), rangeBegin, rangeEnd, compare_it);
      if (auto key = key_from_hex(before))
         end = std::clamp(lower_bound(container, *key), rangeBegin, rangeEnd, compare_it);
      end = std::max(it, end, compare_it);

      Connection result;
      auto add_edge = [&](const auto& it) {
         auto bin = eosio::convert_to_bin(to_key(*it));
         auto cursor = eosio::hex(bin.begin(), bin.end());
         result.edges.push_back(Edge<typename Connection::config>{to_node(*it), std::move(cursor)});
      };

      if (last && !first)
      {
         result.pageInfo.hasNextPage = end != rangeEnd;
         for (; it != end && (*last)-- > 0; --end)
            add_edge(std::prev(end));
         result.pageInfo.hasPreviousPage = end != rangeBegin;
         std::reverse(result.edges.begin(), result.edges.end());
      }
      else
      {
         result.pageInfo.hasPreviousPage = it != rangeBegin;
         for (; it != end && (!first || (*first)-- > 0); ++it)
            add_edge(it);
         result.pageInfo.hasNextPage = it != rangeEnd;
         if (last && *last < result.edges.size())
         {
            result.pageInfo.hasPreviousPage = true;
            result.edges.erase(result.edges.begin(),
                               result.edges.begin() + (result.edges.size() - *last));
         }
      }

      if (!result.edges.empty())
      {
         result.pageInfo.startCursor = result.edges.front().cursor;
         result.pageInfo.endCursor = result.edges.back().cursor;
      }
      return result;
   }
}  // namespace clchain
