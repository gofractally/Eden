#pragma once

#include <clarion/sequence.hpp>
#include <limits>
#include <memory>
#include <utility>

namespace clarion
{
   template <typename Hash>
   class linked_merkle
   {
      using hash_type = decltype(std::declval<Hash>()("", 0));
      struct node
      {
         hash_type value;
         std::unique_ptr<node> left;
         std::unique_ptr<node> right;
      };

     public:
      using range_type = sequence_range;
      hash_type get(sequence_range range)
      {
         if (contains(root_range, range) && root)
         {
            node* current = root.get();
            auto current_range = root_range;
            while (current)
            {
               if (range == current_range)
               {
                  return current->value;
               }
               auto mid = current_range.start +
                          (static_cast<sequence_number>(1) << (current_range.depth - 1));
               if (range.start < mid)
               {
                  current_range = {current_range.start,
                                   static_cast<uint8_t>(current_range.depth - 1)};
                  current = current->left.get();
               }
               else
               {
                  current_range = {mid, static_cast<uint8_t>(current_range.depth - 1)};
                  current = current->right.get();
               }
            }
         }
         else if (contains(range, root_range) && root)
         {
            return root->value;
         }
         return hash_type();
      }
      void set(sequence_number sequence, const hash_type& hash)
      {
         // An empty tree needs special handling
         if (!root)
         {
            root.reset(new node{hash, nullptr, nullptr});
            root_range = {sequence, 0};
            return;
         }
         // Expand the tree to include the new node
         while (!contains(root_range, sequence))
         {
            if (is_left_child(root_range))
            {
               root.reset(new node{root->value, std::move(root), nullptr});
            }
            else
            {
               root.reset(new node{root->value, nullptr, std::move(root)});
            }
            root_range = parent(root_range);
         }
         // Traverse the branch that is being set, creating any missing nodes
         sequence_range current_range = root_range;
         node* stack[std::numeric_limits<sequence_number>::digits];
         stack[current_range.depth] = root.get();
         while (current_range.depth != 0)
         {
            auto mid = current_range.start +
                       (static_cast<sequence_number>(1) << (current_range.depth - 1));
            node* current = stack[current_range.depth];
            std::unique_ptr<node>* child;
            if (sequence < mid)
            {
               current_range = {current_range.start, static_cast<uint8_t>(current_range.depth - 1)};
               child = &current->left;
            }
            else
            {
               current_range = {mid, static_cast<uint8_t>(current_range.depth - 1)};
               child = &current->right;
            }
            if (*child == nullptr)
            {
               child->reset(new node{hash_type(), nullptr, nullptr});
            }
            stack[current_range.depth] = child->get();
         }
         // Walk back up the tree setting the hash of each node
         stack[0]->value = hash;
         for (std::size_t i = 1; i <= root_range.depth; ++i)
         {
            std::array<hash_type, 2> child_hashes = {};
            if (stack[i]->left)
            {
               child_hashes[0] = stack[i]->left->value;
            }
            if (stack[i]->right)
            {
               child_hashes[1] = stack[i]->right->value;
            }
            stack[i]->value = Hash()(child_hashes);
         }
      }

     private:
      std::unique_ptr<node> root;
      sequence_range root_range;
   };
}  // namespace clarion
