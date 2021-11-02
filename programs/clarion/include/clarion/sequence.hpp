#pragma once

#include <cassert>
#include <cstdint>
#include <limits>
#include <utility>

namespace clarion
{
   using sequence_number = std::uint64_t;
   // Invariants: ctz(start) >= depth
   struct sequence_range
   {
      sequence_number start;
      uint8_t depth = 0;
      friend auto operator<=>(const sequence_range&, const sequence_range&) = default;
   };

   constexpr std::pair<sequence_range, sequence_range> split(const sequence_range& range)
   {
      assert(range.depth != 0);
      uint8_t new_depth = range.depth - 1;
      return {{range.start, new_depth},
              {range.start + (sequence_number(1) << new_depth), new_depth}};
   }

   constexpr bool contains(const sequence_range& ancestor, const sequence_range& descendant)
   {
      return descendant.depth <= ancestor.depth && ancestor.start <= descendant.start &&
             (ancestor.depth == std::numeric_limits<sequence_number>::digits ||
              descendant.start < ancestor.start + (sequence_number(1) << ancestor.depth));
   }

   constexpr bool contains(const sequence_range& ancestor, sequence_number descendant)
   {
      return contains(ancestor, sequence_range{descendant, 0});
   }

   constexpr sequence_range parent(const sequence_range& range)
   {
      uint8_t new_depth = range.depth + 1;
      return {range.start & ~(sequence_number(1) << range.depth), new_depth};
   }

   constexpr bool is_left_child(const sequence_range& range)
   {
      return (range.start & (sequence_number(1) << range.depth)) == 0;
   }

   constexpr bool is_right_child(const sequence_range& range) { return !is_left_child(range); }

   constexpr bool is_leaf(const sequence_range& range) { return range.depth == 0; }

   // FIXME: UB if depth == 64
   std::uint64_t size(const sequence_range& range) { return std::uint64_t(1) << range.depth; }
}  // namespace clarion
