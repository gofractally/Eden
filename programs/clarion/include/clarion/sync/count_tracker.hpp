#pragma once

#include <utility>

namespace clarion
{
   template <typename Range>
   struct count_tracker
   {
      using size_type = decltype(size(std::declval<Range>()));
      count_tracker& operator+=(const Range& r)
      {
         total += size(r);
         return *this;
      }
      count_tracker& operator-=(const Range& r)
      {
         total -= size(r);
         return *this;
      }
      bool empty() const { return total == size_type{}; }
      size_type total{};
   };
}  // namespace clarion
