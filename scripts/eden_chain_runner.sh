#!/usr/bin/env sh
set -e

RUNNER=$1
WALLET_FILE=./runner-wallet
CONTRACTS_PKS=5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
PATH=$(pwd)/clsdk/bin:$PATH

echo "Running Eden Ephemeral Chain Runner $RUNNER..."

cleos wallet create -f $WALLET_FILE || true
cleos wallet import --private-key $CONTRACTS_PKS || true

echo "Executing $RUNNER"
cltester -v $RUNNER > eden-runner.log 2>&1 &

until cleos get info | grep -m 1 "chain_id"; do 
    echo "Waiting for nodeos to be responsive..."
    sleep 1
done
sleep 5

cleos set abi eosio.token token.abi
cleos set abi atomicassets atomicassets.abi
cleos set abi atomicmarket atomicmarket.abi
cleos set abi eden.gm eden.abi

if [ -n "$2" ]; then tail -fn +1 eden-runner.log; fi
