#include <eosio/abi_generator.hpp>
#include <set_parameters/set_parameters.hpp>

void set_parameters::contract::setparams(eosio::ignore<eosio::blockchain_parameters> params)
{
   auto& ds = get_datastream();
   eosio::internal_use_do_not_use::set_blockchain_parameters_packed(ds.pos(), ds.remaining());
}

EOSIO_ACTION_DISPATCHER(set_parameters::actions)
EOSIO_ABIGEN(actions(set_parameters::actions))
