# cltester: Starting nodeos

cltester uses chainlib from nodeos, but cltester isn't nodeos, so is missing some functionality. e.g. it can't connect to nodes using p2p, and it can't serve json rpc requests. It can, however, spawn nodeos on a chain which cltester created. This can help with system-wide testing, e.g. testing nodejs and web apps.

```c++
TEST_CASE("start nodeos")
{
   // Prepare a chain
   test_chain chain;
   setup(chain);

   // cltester doesn't need ABIs, but most other tools do
   chain.set_abi("eosio.token"_n, CLSDK_CONTRACTS_DIR "token.abi");
   chain.set_abi("example"_n, "testable.abi");

   // Alice buys some dogs
   chain.as("alice"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "barf"_n, s2a("110.0000 EOS"));

   // Make the above irreversible. This causes the transactions to
   // go into the block log.
   chain.finish_block();
   chain.finish_block();

   // Copy blocks.log into a fresh directory for nodeos to use
   eosio::execute("rm -rf example_chain");
   eosio::execute("mkdir -p example_chain/blocks");
   eosio::execute("cp " + chain.get_path() + "/blocks/blocks.log example_chain/blocks");

   // Run nodeos
   eosio::execute(
       "nodeos -d example_chain "
       "--config-dir example_config "
       "--plugin eosio::chain_api_plugin "
       "--access-control-allow-origin \"*\" "
       "--access-control-allow-header \"*\" "
       "--http-validate-host 0 "
       "--http-server-address 0.0.0.0:8888 "
       "--contracts-console "
       "-e -p eosio");
}
```

After running the above, cleos should now function:

```
cleos push action example buydog '["alice", "spot", "90.0000 EOS"]' -p alice
cleos get table example example balance
cleos get table example example animal
```
