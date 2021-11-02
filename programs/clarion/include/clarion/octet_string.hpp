#pragma once

#include <utility>
#include <vector>

namespace clarion
{
   using octet_string = std::vector<unsigned char>;

   struct octet_string_range
   {
      std::vector<unsigned char> prefix;
      unsigned char bits = 0xFF;
      static constexpr unsigned char end_string = 0xFF;
      friend auto operator<=>(const octet_string_range&, const octet_string_range&) = default;
   };

   inline std::pair<octet_string_range, octet_string_range> split(const octet_string_range& range)
   {
      std::pair<octet_string_range, octet_string_range> result{{range.prefix}, {range.prefix}};
      if (range.bits == 8)
      {
         result.second.prefix.push_back(0);
         result.first.bits = octet_string_range::end_string;
         result.second.bits = 0;
      }
      else
      {
         result.second.prefix.back() |= (1 << (7 - range.bits));
         result.first.bits = range.bits + 1;
         result.second.bits = range.bits + 1;
      }
      return result;
   }

   inline bool contains(const octet_string_range& ancestor, const octet_string_range& descendant)
   {
      if (ancestor.bits == octet_string_range::end_string)
      {
         return ancestor == descendant;
      }
      if (ancestor.prefix.empty())
      {
         return true;
      }
      if (ancestor.prefix.size() > descendant.prefix.size())
      {
         return false;
      }
      if (ancestor.prefix.size() == descendant.prefix.size() && ancestor.bits > descendant.bits)
      {
         return false;
      }
      if (!std::equal(ancestor.prefix.begin(), ancestor.prefix.end() - 1,
                      descendant.prefix.begin()))
      {
         return false;
      }
      unsigned char mask = (0xFF00u >> ancestor.bits) & 0xFFu;
      if (ancestor.prefix[ancestor.prefix.size() - 1] ==
          (descendant.prefix[ancestor.prefix.size() - 1] & mask))
      {
         return true;
      }
      return false;
   }

   inline bool contains(const octet_string_range& ancestor, const octet_string& key)
   {
      return contains(ancestor, octet_string_range{key});
   }

   inline octet_string_range parent(const octet_string_range& range)
   {
      if (range.bits == octet_string_range::end_string)
      {
         return {range.prefix, 8};
      }
      else if (range.bits == 0)
      {
         return {{range.prefix.begin(), range.prefix.end() - 1}, 8};
      }
      else
      {
         octet_string_range result = range;
         result.prefix.back() &= ~(0x100 >> range.bits);
         result.bits = range.bits - 1;
         return result;
      }
   }

   inline bool is_left_child(const octet_string_range& range)
   {
      return range.bits == octet_string_range::end_string ||
             ((range.bits != 0) && ((range.prefix.back() & (0x100 >> range.bits)) == 0));
   }

   inline bool is_right_child(const octet_string_range& range) { return !is_left_child(range); }

   inline bool is_leaf(const octet_string_range& range)
   {
      return range.bits == octet_string_range::end_string;
   }
}  // namespace clarion
