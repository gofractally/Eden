#include <bylaws.hpp>
#include <eden.hpp>

namespace eden
{
   void eden::bylawspropose(eosio::name proposer, const std::string& bylaws_text)
   {
      eosio::require_auth(proposer);
      bylaws bylaws(get_self());
      bylaws.set_proposed(proposer, bylaws_text);
   }

   void eden::bylawsapprove(eosio::name approver, const eosio::checksum256& bylaws_hash)
   {
      eosio::require_auth(approver);
      bylaws bylaws(get_self());
      bylaws.approve_proposed(approver, bylaws_hash);
   }

   void eden::bylawsratify(eosio::name approver, const eosio::checksum256& bylaws_hash)
   {
      eosio::require_auth(approver);
      bylaws bylaws(get_self());
      bylaws.approve_pending(approver, bylaws_hash);
   }
}  // namespace eden
