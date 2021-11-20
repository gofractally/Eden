#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

// The contract class must be in a namespace
namespace example
{
   // The contract
   struct example_contract : public eosio::contract
   {
      // Use the base class constructors
      using eosio::contract::contract;

      // Action: user buys a dog
      void buydog(eosio::name user, eosio::name dog, const eosio::asset& price)
      {
         // TODO: buy a dog
      }
   };

   // First part of the dispatcher
   EOSIO_ACTIONS(example_contract,  //
                 "example"_n,       //
                 action(buydog, user, dog, price))
}  // namespace example

// Final part of the dispatcher
EOSIO_ACTION_DISPATCHER(example::actions)

// ABI generation
EOSIO_ABIGEN(actions(example::actions))
