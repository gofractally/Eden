#include <accounts.hpp>
#include <eden.hpp>
#include <inductions.hpp>
#include <members.hpp>

EOSIO_ACTION_DISPATCHER(eden::actions)
EOSIO_ABIGEN(table("account"_n, eden::account_variant),
             table("member"_n, eden::member_variant),
             table("induction"_n, eden::induction_variant),
             table("endorsement"_n, eden::endorsement_variant),
             table("global"_n, eden::global_variant),
             table("memberstats"_n, eden::member_stats_variant),
             actions(eden::actions))
