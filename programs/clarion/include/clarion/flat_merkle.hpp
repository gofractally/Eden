#pragma once

#include <algorithm>
#include <array>
#include <clarion/sequence.hpp>
#include <clarion/sha256.hpp>
#include <cstdint>
#include <cstring>
#include <functional>
#include <iostream>
#include <streambuf>
#include <utility>
#include <vector>

namespace clarion
{
   // This format represents a dense merkle tree.
   // Each node in the tree is represented by a single hash.
   // The tree structure is defined implicitly by the index of each hash.
   //
   // The tree is built from fixed size pages, each page holds a complete
   // subtree of 2^k - 1 nodes.  The size of the subtree is configurable.
   //
   // Assuming that each hash is 32-bytes, and we want a page size of 4 KiB,
   // the depth of the subtree is 7, and each holds 127 nodes.
   // The tree for 524,288 messages will be 3 pages deep and use 32 MiB.
   //
   // Pages are ordered by traversing the first child subtree, the node, then the remaining child subtrees
   // - Each pages has 2^k children
   // - Every complete subtree is stored in contiguous pages
   // - For k = 1, this is equivalent to an in-order traversal.
   //
   // Nodes within a page are ordered as one unit of free space (can be used for metadata),
   // followed by a breadth-first traversal of the subtree starting at the root.
   template <typename Hash, std::size_t PageSize>
   struct flat_merkle
   {
      // should use streamoff_t instead of size_t to handle large files
      using size_type = std::uint64_t;
      using hash_type = decltype(std::declval<Hash>()("", 0));
      using range_type = sequence_range;
      static constexpr uint64_t depth_per_page =
          63 - (__builtin_clzll(PageSize / (2 * sizeof(hash_type))));
      static_assert(depth_per_page > 0, "Page size is too small");

      static constexpr size_type pages_in_subtree(std::size_t subtree_depth)
      {
         return ((1ull << (subtree_depth * depth_per_page)) - 1) / ((1ull << depth_per_page) - 1);
      }
      static constexpr size_type previous_sibling_count(sequence_number start, std::size_t depth)
      {
         return (start >> ((depth + 1) * depth_per_page - 1)) & ((1ull << depth_per_page) - 1);
      }
      static constexpr sequence_number parent_page_start(sequence_number start, std::size_t depth)
      {
         return start & ~((1ull << ((depth + 1) * depth_per_page)) - 1);
      }
      // Returns the number of pages before the subtree rooted at the given location
      static constexpr size_type pages_before(sequence_number start, std::size_t depth)
      {
         size_type result = 0;
         while (start != 0)
         {
            if (auto previous_siblings = previous_sibling_count(start, depth))
            {
               result += 1 + previous_siblings * pages_in_subtree(depth + 1);
            }
            start = parent_page_start(start, depth);
            ++depth;
         }
         return result;
      }
      // \pre (range.second - range.first) is a power of 2
      //
      // There are exactly (2^depth_per_page - 1) possible inputs that map to each result.
      // For all k, if range.first and range.second are both <= 2^k, then the result is
      // <
      static size_type get_page(sequence_range range)
      {
         auto depth = range.depth / depth_per_page;
         return pages_before(range.start, depth) + pages_in_subtree(depth);
      }
      static size_type get_parent_page(size_type page, sequence_number start, std::size_t depth)
      {
         if (auto previous_siblings = previous_sibling_count(start, depth))
         {
            return page - (previous_siblings - 1) * pages_in_subtree(depth + 1) - 1 -
                   pages_in_subtree(depth);
         }
         else
         {
            return page + 1 + ((1 << depth_per_page) - 1) * pages_in_subtree(depth);
         }
      }
      static size_type get_left_child_page(size_type page, sequence_number start, std::size_t depth)
      {
         return page - 1 - ((1 << depth_per_page) - 1) * pages_in_subtree(depth - 1);
      }
      static std::size_t get_offset(sequence_range range)
      {
         auto base = range.depth;
         auto depth = base / depth_per_page;
         auto top_depth = (depth + 1) * depth_per_page - 1;
         std::size_t row_start = 1 << (top_depth - base);
         std::size_t column = (range.start >> base) & ((1 << (top_depth - base)) - 1);
         return row_start + column;
      }
      uint64_t low_sequence = 0;
      uint64_t high_sequence = 0;
      using page_type = std::array<std::array<hash_type, 2>, 64>;
      std::vector<page_type> pages;
      void init_page(uint64_t pagenum, sequence_number start, std::size_t depth)
      {
         if (depth != 0)
         {
            // set left hash to root of left child, other hashes are 0
            auto current_hash = Hash()(pages[get_left_child_page(pagenum, start, depth)][1]);
            auto& page = pages[pagenum];
            std::size_t offset = (1 << (depth_per_page - 1));
            for (int i = 0; i < depth_per_page; ++i)
            {
               page[offset][0] = current_hash;
               current_hash = Hash()(page[offset]);
               offset >>= 1;
            }
         }
      }
      static constexpr std::pair<sequence_number, std::size_t> next_page(sequence_number start,
                                                                         std::size_t depth)
      {
         if (depth == 0)
         {
            // While this is a right child, move up the tree
            auto left_count = __builtin_ctzll((start >> depth_per_page) + 1) / depth_per_page;
            // If this is a left child, return the parent
            if (((start >> ((left_count + 1) * depth_per_page)) & ((1ull << depth_per_page) - 1)) ==
                0)
            {
               return {start & ~((1ull << (left_count + 1) * depth_per_page) - 1), left_count + 1};
            }
            // Otherwise return the next sibling
            return {start + (1ull << depth_per_page), 0};
         }
         else
         {
            // The beginning of the second child
            return {start + (1ull << (depth * depth_per_page)), 0};
         }
      }
      static sequence_range get_sequence(size_type page)
      {
         // find the largest subtree with size <= page
         // find subtree within subtree
         uint64_t sequence = page * ((1ull << depth_per_page) - 1);
         sequence_number result = 0;
         while (true)
         {
            auto digits = 64 - __builtin_clzll(sequence + 1);
            uint8_t root_depth = (digits - 1) / depth_per_page;
            auto base = (1ull << root_depth * depth_per_page);
            if (sequence + 1 == base)
            {
               return {result, root_depth};
            }
            else
            {
               sequence -= ((1ull << depth_per_page) - 1);
               auto sibling_size = base - 1;
               auto previous_siblings = sequence / sibling_size;
               result += (base >> 1) * previous_siblings;
               sequence %= sibling_size;
            }
         }
      }
      void resize(uint64_t new_size)
      {
         std::size_t old_size = pages.size();
         pages.resize(new_size);
         auto [sequence, depth] = get_sequence(old_size);
         for (std::size_t i = old_size; i < new_size; ++i)
         {
            init_page(i, sequence, depth);
            std::tie(sequence, depth) = next_page(sequence, depth);
         }
      }

      sequence_range root() const
      {
         return {0, static_cast<uint8_t>(64 - __builtin_clzll(high_sequence))};
      }

      hash_type get(sequence_range range) const
      {
         sequence_range adjusted_range{range.start / 2, range.depth};
         auto page_num = get_page(adjusted_range);
         auto offset = get_offset(adjusted_range);
         if (page_num < pages.size())
         {
            return pages[page_num][offset][is_right_child(range)];
         }
         else if (!pages.empty())
         {
            size_type root_page = 0;
            for (std::size_t depth = 0;; ++depth)
            {
               auto parent_page = get_parent_page(root_page, 0, depth);
               if (parent_page < pages.size())
               {
                  root_page = parent_page;
               }
               else
               {
                  if (contains(range, sequence_range{0, uint8_t((depth + 1) * depth_per_page)}))
                  {
                     return Hash()(pages[root_page][1]);
                  }
                  else
                  {
                     break;
                  }
               }
            }
         }
         return hash_type();
      }
      void set(sequence_number sequence, const hash_type& hash)
      {
         high_sequence = std::max(high_sequence, sequence);
         auto start = sequence / 2;
         sequence_range range{sequence / 2, 0};
         auto page_num = get_page(range);
         std::size_t which_child = (sequence & 1);
         auto current_hash = hash;
         for (std::size_t depth = 0; start >= low_sequence &&
                                     ((1ull << (depth * depth_per_page)) < (high_sequence + 1) * 2);
              ++depth)
         {
            if (pages.size() <= page_num)
            {
               resize(page_num + 1);
            }
            auto& page = pages[page_num];
            std::size_t row_start = (1 << (depth_per_page - 1));
            auto offset = ((start >> (depth * depth_per_page)) & (row_start - 1)) | row_start;
            for (int i = 0; i < depth_per_page; ++i)
            {
               page[offset][which_child] = current_hash;
               current_hash = Hash()(page[offset]);
               which_child = (offset & 1);
               offset >>= 1;
            }
            page_num = get_parent_page(page_num, start, depth);
            auto parent_bit = (depth + 1) * depth_per_page;
            which_child = (start >> (parent_bit - 1)) & 1;
            start = start & ~((1ull << parent_bit) - 1);
         }
      }
      void read(std::streambuf* in)
      {
         page_type page;
         while (in->sgetn((char*)&page, sizeof(page)))
         {
            pages.push_back(page);
         }
         if (!pages.empty())
         {
            memcpy(&high_sequence, &pages[0], sizeof(high_sequence));
         }
      }
      void write(std::streambuf* out)
      {
         if (!pages.empty())
         {
            memcpy(&pages[0], &high_sequence, sizeof(high_sequence));
            out->sputn((char*)pages.data(), pages.size() * sizeof(pages[0]));
         }
      }
   };
}  // namespace clarion
