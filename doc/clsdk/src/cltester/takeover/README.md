# cltester: Hostile Takeover

cltester can fork the state of an existing chain. This example loads an EOS snapshot, replaces the eosio and producer keys, and launches a nodeos instance which acts as 21 producers.

```c++
TEST_CASE("Takeover")
{
   std::cout << "Loading snapshot...\n";

   // This constructor loads a snapshot. The second argument is the max database size.
   test_chain chain{"/home/todd/work/snapshot-2021-11-21-22-eos-v4-0216739301.bin",
                    uint64_t(20) * 1024 * 1024 * 1024};

   // Replace production keys and eosio keys. These functions don't push any
   // transactions. Instead, they directly modify the chain state in a way which
   // violates consensus rules.
   std::cout << "Replacing keys...\n";
   chain.replace_producer_keys(test_chain::default_pub_key);
   chain.replace_account_keys("eosio"_n, "owner"_n, test_chain::default_pub_key);
   chain.replace_account_keys("eosio"_n, "active"_n, test_chain::default_pub_key);

   // We replaced the production keys, but the system contract can switch
   // them back. Let's fix that.
   for (auto prod :
        {"atticlabeosb"_n, "aus1genereos"_n, "big.one"_n,      "binancestake"_n, "bitfinexeos1"_n,
         "blockpooleos"_n, "eosasia11111"_n, "eoscannonchn"_n, "eoseouldotio"_n, "eosflytomars"_n,
         "eoshuobipool"_n, "eosinfstones"_n, "eosiosg11111"_n, "eoslaomaocom"_n, "eosnationftw"_n,
         "hashfineosio"_n, "newdex.bp"_n,    "okcapitalbp1"_n, "starteosiobp"_n, "whaleex.com"_n,
         "zbeosbp11111"_n})
   {
      std::cout << "    " << prod.to_string() << "\n";
      chain.replace_account_keys(prod, "owner"_n, test_chain::default_pub_key);
      chain.replace_account_keys(prod, "active"_n, test_chain::default_pub_key);
      chain.transact({
          action{{{"eosio"_n, "owner"_n}}, "eosio.null"_n, "free.trx"_n, std::tuple{}},
          action{{{prod, "owner"_n}},
                 "eosio"_n,
                 "regproducer"_n,
                 std::make_tuple(prod, test_chain::default_pub_key, std::string("url"),
                                 uint16_t(1234))},
      });
   }

   // Make a donation. This works because eosio.rex delegates to eosio,
   // and we replaced eosio's keys.
   chain.transact({
       action{{{"eosio"_n, "owner"_n}}, "eosio.null"_n, "free.trx"_n, std::tuple{}},
       action{{{"eosio.rex"_n, "owner"_n}},
              "eosio.token"_n,
              "transfer"_n,
              std::make_tuple("eosio.rex"_n, "genesis.eden"_n, s2a("50000000.0000 EOS"),
                              std::string("donate"))},
   });

   // Produce the block
   chain.finish_block();

   // shut down the chain so we can safely copy the database
   std::cout << "Shutdown...\n";
   chain.shutdown();

   // Copy everything into a fresh directory for nodeos to use
   std::cout << "Copy...\n";
   eosio::execute("rm -rf forked_chain");
   eosio::execute("cp -r " + chain.get_path() + " forked_chain");

   // Run nodeos. We must use the build which is packaged with clsdk since we're
   // loading the non-portable database.
   std::cout << "Start nodeos...\n";
   eosio::execute(
       "./clsdk/bin/nodeos "
       "-d forked_chain "
       "--config-dir example_config "
       "--plugin eosio::chain_api_plugin "
       "--access-control-allow-origin \"*\" "
       "--access-control-allow-header \"*\" "
       "--http-validate-host 0 "
       "--http-server-address 0.0.0.0:8888 "
       "--contracts-console "
       "-e "
       "-p atticlabeosb "
       "-p aus1genereos "
       "-p big.one "
       "-p binancestake "
       "-p bitfinexeos1 "
       "-p blockpooleos "
       "-p eosasia11111 "
       "-p eoscannonchn "
       "-p eoseouldotio "
       "-p eosflytomars "
       "-p eoshuobipool "
       "-p eosinfstones "
       "-p eosiosg11111 "
       "-p eoslaomaocom "
       "-p eosnationftw "
       "-p hashfineosio "
       "-p newdex.bp "
       "-p okcapitalbp1 "
       "-p starteosiobp "
       "-p whaleex.com "
       "-p zbeosbp11111 ");
}
```
