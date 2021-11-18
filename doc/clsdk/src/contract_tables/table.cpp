#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>

namespace example
{
   // A purchased animal
   struct animal
   {
      eosio::name name;             // Name of animal
      eosio::name type;             // Type of animal
      eosio::name owner;            // Who owns the animal
      eosio::asset purchase_price;  // How much the owner paid

      uint64_t primary_key() const { return name.value; }
   };

   // This does 2 things:
   // * Controls which fields are stored in the table
   // * Lets the ABI generator know the field names
   EOSIO_REFLECT(animal, name, type, owner, purchase_price)

   // Table definition
   typedef eosio::multi_index<"animal"_n, animal> animal_table;

   struct example_contract : public eosio::contract
   {
      using eosio::contract::contract;

      // Action: user buys a dog
      void buydog(eosio::name user, eosio::name dog, const eosio::asset& price)
      {
         require_auth(user);
         animal_table table{get_self(), get_self().value};
         table.emplace(user, [&](auto& record) {
            record.name = dog;
            record.type = "dog"_n;
            record.owner = user;
            record.purchase_price = price;
         });
      }
   };

   EOSIO_ACTIONS(example_contract,  //
                 "example"_n,       //
                 action(buydog, user, dog, price))
}  // namespace example

EOSIO_ACTION_DISPATCHER(example::actions)

EOSIO_ABIGEN(
    // Include the contract actions in the ABI
    actions(example::actions),

    // Include the table in the ABI
    table("animal"_n, example::animal))
