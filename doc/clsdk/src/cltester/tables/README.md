# cltester: Reading Tables

Test cases can use the same database facilities (read-only) that contracts use. If contracts define all their tables in headers, then the test cases can get the table definitions from the headers.

## Dumping table content

The tables in the example contract use a single scope. This makes it possible to iterate through all of the content in a table. The token contract uses a different scope for each user. This makes iteration infeasible. Instead, the test code has to explicitly specify each account to list the accounts' balances.

This extends the test cases in [Token Support](../token/index.html):

```c++
void dump_tokens(const std::vector<name> owners)
{
   printf("\nTokens\n=====\n");
   for (auto owner : owners)
   {
      token::accounts table("eosio.token"_n, owner.value);
      for (auto& account : table)
         printf("%-12s %s\n",
                owner.to_string().c_str(),
                account.balance.to_string().c_str());
   }
}

void dump_animals()
{
   printf("\nAnimals\n=====\n");
   example::animal_table table("example"_n, "example"_n.value);
   for (auto& animal : table)
      printf("%-12s %-12s %-12s %s\n",
             animal.name.to_string().c_str(),
             animal.type.to_string().c_str(),
             animal.owner.to_string().c_str(),
             animal.purchase_price.to_string().c_str());
}

TEST_CASE("Read Database")
{
   test_chain chain;
   setup(chain);

   chain.as("alice"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "barf"_n, s2a("110.0000 EOS"));
   chain.as("bob"_n).act<token::actions::transfer>(
       "bob"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("bob"_n).act<example::actions::buydog>(
       "bob"_n, "wolf"_n, s2a("100.0000 EOS"));

   dump_tokens({"eosio"_n, "alice"_n, "bob"_n, "example"_n});
   dump_animals();
}
```

## JSON form

clsdk comes with json conversion functions. These can aid dumping tables.

```c++
template <typename Table>
void dump_table(name contract, uint64_t scope)
{
   Table table(contract, scope);
   for (auto& record : table)
      std::cout << format_json(record) << "\n";
}

TEST_CASE("Read Database 2")
{
   test_chain chain;
   setup(chain);

   chain.as("alice"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "barf"_n, s2a("110.0000 EOS"));
   chain.as("bob"_n).act<token::actions::transfer>(
       "bob"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("bob"_n).act<example::actions::buydog>(
       "bob"_n, "wolf"_n, s2a("100.0000 EOS"));

   printf("\nBalances\n=====\n");
   dump_table<example::balance_table>("example"_n, "example"_n.value);

   printf("\nAnimals\n=====\n");
   dump_table<example::animal_table>("example"_n, "example"_n.value);
}
```

## Verifying table content

Test cases often need to verify table content is correct.

```c++
example::animal get_animal(name animal_name)
{
   example::animal_table table("example"_n, "example"_n.value);
   auto it = table.find(animal_name.value);
   if (it != table.end())
      return *it;
   else
      return {};  // return empty record if not found
}

TEST_CASE("Verify Animals")
{
   test_chain chain;
   setup(chain);

   chain.as("alice"_n).act<token::actions::transfer>(
       "alice"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "fido"_n, s2a("100.0000 EOS"));
   chain.as("alice"_n).act<example::actions::buydog>(
       "alice"_n, "barf"_n, s2a("110.0000 EOS"));
   chain.as("bob"_n).act<token::actions::transfer>(
       "bob"_n, "example"_n, s2a("300.0000 EOS"), "");
   chain.as("bob"_n).act<example::actions::buydog>(
       "bob"_n, "wolf"_n, s2a("100.0000 EOS"));

   auto fido = get_animal("fido"_n);
   CHECK(fido.name == "fido"_n);
   CHECK(fido.type == "dog"_n);
   CHECK(fido.owner == "alice"_n);
   CHECK(fido.purchase_price == s2a("100.0000 EOS"));
}
```

The CHECK macro verifies its condition is met. The `-s` command-line option shows the progress of these checks:

```
$ cltester tests.wasm -s

...
/.../tests.cpp:78: PASSED:
  CHECK( fido.name == "fido"_n )
with expansion:
  fido == fido

/.../tests.cpp:79: PASSED:
  CHECK( fido.type == "dog"_n )
with expansion:
  dog == dog
...
```

## Table caching issue

The above examples open tables within helper functions to avoid an issue with `multi_index`. multi_index caches data and so gets confused if a contract modifies a table while the tester has that table currently open.
