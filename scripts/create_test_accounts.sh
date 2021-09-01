#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://waxtest.eosn.io"
CREATOR="edev"
ACCOUNT=$1

$CLEOS system newaccount $CREATOR --transfer $ACCOUNT EOS5s3s1cAxBMFqTE5tDX1FtPQA3Artk4s3xMjgpbQBGBED9FM1zp --stake-net "20.00000000 WAX" --stake-cpu "20.00000000 WAX" --buy-ram-kbytes 8
$CLEOS transfer $CREATOR $ACCOUNT "20.00000000 WAX" "eden-test"

# eg: running this script in (dumb) bulk for multiple accounts
# ./scripts/create_test_accounts.sh test121.edev && \
# ./scripts/create_test_accounts.sh test122.edev && \
# ./scripts/create_test_accounts.sh test123.edev && \
# ./scripts/create_test_accounts.sh test124.edev && \
# ./scripts/create_test_accounts.sh test125.edev && \
# ./scripts/create_test_accounts.sh test131.edev && \
# ./scripts/create_test_accounts.sh test132.edev && \
# ./scripts/create_test_accounts.sh test133.edev && \
# ./scripts/create_test_accounts.sh test134.edev && \
# ./scripts/create_test_accounts.sh test135.edev && \
# ./scripts/create_test_accounts.sh test141.edev && \
# ./scripts/create_test_accounts.sh test142.edev && \
# ./scripts/create_test_accounts.sh test143.edev && \
# ./scripts/create_test_accounts.sh test144.edev && \
# ./scripts/create_test_accounts.sh test145.edev && \
# ./scripts/create_test_accounts.sh test151.edev && \
# ./scripts/create_test_accounts.sh test152.edev && \
# ./scripts/create_test_accounts.sh test153.edev && \
# ./scripts/create_test_accounts.sh test154.edev && \
# ./scripts/create_test_accounts.sh test155.edev && \
# ./scripts/create_test_accounts.sh test211.edev && \
# ./scripts/create_test_accounts.sh test212.edev && \
# ./scripts/create_test_accounts.sh test213.edev && \
# ./scripts/create_test_accounts.sh test214.edev && \
# ./scripts/create_test_accounts.sh test215.edev && \
# ./scripts/create_test_accounts.sh test221.edev && \
# ./scripts/create_test_accounts.sh test222.edev && \
# ./scripts/create_test_accounts.sh test223.edev && \
# ./scripts/create_test_accounts.sh test224.edev && \
# ./scripts/create_test_accounts.sh test225.edev && \
# ./scripts/create_test_accounts.sh test231.edev && \
# ./scripts/create_test_accounts.sh test232.edev && \
# ./scripts/create_test_accounts.sh test233.edev && \
# ./scripts/create_test_accounts.sh test234.edev && \
# ./scripts/create_test_accounts.sh test235.edev && \
# ./scripts/create_test_accounts.sh test241.edev && \
# ./scripts/create_test_accounts.sh test242.edev && \
# ./scripts/create_test_accounts.sh test243.edev && \
# ./scripts/create_test_accounts.sh test244.edev && \
# ./scripts/create_test_accounts.sh test245.edev && \
# ./scripts/create_test_accounts.sh test251.edev && \
# ./scripts/create_test_accounts.sh test252.edev && \
# ./scripts/create_test_accounts.sh test253.edev && \
# ./scripts/create_test_accounts.sh test254.edev && \
# ./scripts/create_test_accounts.sh test255.edev
