#pragma once

#include <clarion/sequence.hpp>
#include <clarion/signature.hpp>
#include <string>

namespace clarion
{
   struct message
   {
      sequence_number sequence;
      std::string body;
   };

   struct signed_message
   {
      message data;
      clarion::signature signature;
   };
}  // namespace clarion
