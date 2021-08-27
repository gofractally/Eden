#include <accounts.hpp>
#include <auctions.hpp>
#include <bylaws.hpp>
#include <distributions.hpp>
#include <eden.hpp>
#include <elections.hpp>
#include <encrypt.hpp>
#include <inductions.hpp>
#include <members.hpp>
#include <migrations.hpp>

extern "C"
{
   void __wasm_call_ctors();
   void apply(uint64_t receiver, uint64_t code, uint64_t action)
   {
      __wasm_call_ctors();
      eden::actions::eosio_apply(receiver, code, action);
      eden::send_events(eosio::name{receiver});
   }
}

EOSIO_ABIGEN(
    // This overrides the default names within
    // attribute_value to preserve JSON compatibility
    variant("attribute_value",
            eden::atomicassets::attribute_value,
            "int8",
            "int16",
            "int32",
            "int64",
            "uint8",
            "uint16",
            "uint32",
            "uint64",
            "float32",
            "float64",
            "string",
            "INT8_VEC",
            "INT16_VEC",
            "INT32_VEC",
            "INT64_VEC",
            "UINT8_VEC",
            "UINT16_VEC",
            "UINT32_VEC",
            "UINT64_VEC",
            "FLOAT_VEC",
            "DOUBLE_VEC",
            "STRING_VEC"),
    actions(eden::actions),
    table("account"_n, eden::account_variant),
    table("auction"_n, eden::auction_variant),
    table("bylaws"_n, eden::bylaws_variant),
    table("distaccount"_n, eden::distribution_account_variant),
    table("distribution"_n, eden::distribution_variant),
    table("endorsement"_n, eden::endorsement_variant),
    table("elect.curr"_n, eden::current_election_state),
    table("elect.state"_n, eden::election_state_variant),
    table("encrypted"_n, eden::encrypted_data_variant),
    table("global"_n, eden::global_variant),
    table("induction"_n, eden::induction_variant),
    table("member"_n, eden::member_variant),
    table("memberstats"_n, eden::member_stats_variant),
    table("migration"_n, eden::migration_variant),
    table("pools"_n, eden::pool_variant),
    table("votes"_n, eden::vote),
    ricardian_clause("peacetreaty", eden::peacetreaty_clause),
    ricardian_clause("bylaws", eden::bylaws_clause))
