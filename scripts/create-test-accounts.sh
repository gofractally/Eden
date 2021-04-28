#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"
CREATOR="edenmember11"
ACCOUNT="edenmember45"

$CLEOS system newaccount $CREATOR --transfer $ACCOUNT EOS5s3s1cAxBMFqTE5tDX1FtPQA3Artk4s3xMjgpbQBGBED9FM1zp --stake-net "20.00000000 WAX" --stake-cpu "20.00000000 WAX" --buy-ram-kbytes 8
$CLEOS transfer $CREATOR $ACCOUNT "10.00000000 WAX" "eden-test"
