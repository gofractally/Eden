#include <accounts.hpp>
#include <eden.hpp>
#include <inductions.hpp>
#include <members.hpp>

EOSIO_ACTION_DISPATCHER(eden::actions)
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
    table("endorsement"_n, eden::endorsement_variant),
    table("global"_n, eden::global_variant),
    table("induction"_n, eden::induction_variant),
    table("member"_n, eden::member_variant),
    table("memberstats"_n, eden::member_stats_variant))
