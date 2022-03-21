# cltester: Block Control

The `test_chain` class gives you control over block production, including control over time.

## start_block

At any point, you can start producing a new block:

```
chain.start_block();
```

This finishes producing the current block (if one is being produced), then starts producing a new one. All transactions after this point go into the new block.

You can skip time:

```
chain.start_block(2000); // skip 2000ms-worth of blocks
```

* 0 skips nothing; the new block is 500ms after the current block being produced (if any), or 500ms after the previous block.
* 500 skips 1 block
* 1000 skips 2 blocks

You can also skip to a specific time:

```
chain.start_block("2020-07-03T15:29:59.500");
```

or

```
eosio::time_point t = ...;
chain.start_block(t);
```

Note when skipping time: `start_block` creates an empty block immediately before the new one. This allows TAPoS to operate correctly after skipping large periods of time.

## finish_block

At any point, you can stop producing the current block:

```
chain.finish_block();
```

After you call finish_block, the system is in a state where no blocks are being produced. The following cause the system to start producing a new block:

* using start_block
* pushing a transaction
* using finish_block again. This causes the system to start a new block then finish it.

## Getting the head block time

This gets the head block time as a `time_point`:

```
auto t = chain.get_head_block_info().timestamp.to_time_point();
```

Note: the head block is not the block that's currently being produced. Instead, it's the last block which was finished.

You can display the time:

```
std::cout << convert_to_json(t) << "\n";
```

You can also do arithmetic on time:

```
chain.start_block(
   chain.get_head_block_info().timestamp.to_time_point() +
   eosio::days(8) + eosio::hours(1));
```

## Fixing duplicate transactions

It's easy to create a test which tries to push duplicate transactions. Call `start_block` before the duplicate transaction to solve this.

## Fixing full blocks

It's easy to overfill a block, causing a test failure. Use `start_block` to solve this.
