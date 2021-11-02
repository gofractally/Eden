#pragma once

#include <array>
#include <map>
#include <utility>

namespace clarion
{
   template <typename Key, typename Range, typename Hash>
   class kv_merkle
   {
     public:
      using hash_type = decltype(std::declval<Hash>()("", 0));
      using range_type = Range;
      Range root() const { return root_range; }
      hash_type get(const Range& range) const
      {
         if (contains(range, root_range))
         {
            return kv.find(root_range)->second;
         }
         else
         {
            auto iter = kv.find(range);
            if (iter != kv.end())
            {
               return iter->second;
            }
            else
            {
               return hash_type{};
            }
         }
      }
      void set(const Key& key, const hash_type& hash)
      {
         Range range{key};
         if (kv.empty())
         {
            kv.emplace(key, hash);
            root_range = range;
         }
         else if (!contains(root_range, key))
         {
            auto root_hash = kv[root_range];
            root_range = parent(root_range);
            while (!contains(root_range, key))
            {
               kv[root_range] = root_hash;
               root_range = parent(root_range);
            }
            while (true)
            {
               kv[range] = hash;
               auto next_range = parent(range);
               if (next_range == root_range)
               {
                  break;
               }
               range = std::move(next_range);
            }
            std::array<hash_type, 2> child_hashes;
            if (is_left_child(range))
            {
               child_hashes[0] = hash;
               child_hashes[1] = root_hash;
            }
            else
            {
               child_hashes[0] = root_hash;
               child_hashes[1] = hash;
            }
            kv[root_range] = Hash()(child_hashes);
         }
         else
         {
            kv[range] = hash;
            hash_type current_hash = hash;
            while (range != root_range)
            {
               if (is_left_child(range))
               {
                  range = parent(range);
                  auto [l, r] = split(range);
                  std::array<hash_type, 2> child_hashes = {{current_hash, {}}};
                  if (auto iter = kv.find(r); iter != kv.end())
                  {
                     child_hashes[1] = iter->second;
                  }
                  kv[range] = current_hash = Hash()(child_hashes);
               }
               else
               {
                  range = parent(range);
                  auto [l, r] = split(range);
                  std::array<hash_type, 2> child_hashes = {{{}, current_hash}};
                  if (auto iter = kv.find(l); iter != kv.end())
                  {
                     child_hashes[0] = iter->second;
                  }
                  kv[range] = current_hash = Hash()(child_hashes);
               }
            }
         }
      }

     private:
      Range root_range;
      std::map<Range, hash_type> kv;
   };
}  // namespace clarion
