#include <activate_feature/activate_feature.hpp>
#include <eosio/abi_generator.hpp>

void activate_feature::contract::activate(eosio::checksum256& feature_digest)
{
   eosio::preactivate_feature(feature_digest);
}

EOSIO_ACTION_DISPATCHER(activate_feature::actions)
EOSIO_ABIGEN(actions(activate_feature::actions))
