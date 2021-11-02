#pragma once

#include <clarion/object.hpp>

namespace clarion
{
   // This message constitutes a request to synchronize the range in question
   template <typename Range, typename Hash>
   struct node_message
   {
      Range range;
      Hash hash;
   };

   template <typename Range, typename Hash>
   struct root_message
   {
      Range range;
      Hash hash;
   };

   template <typename Range>
   struct ack_message
   {
      Range range;
   };

   template <typename T>
   struct leaf_message
   {
      T contents;
   };

   struct bind_message
   {
      object_id id;
      object_kind type;
   };

   struct null_message
   {
   };
}  // namespace clarion
