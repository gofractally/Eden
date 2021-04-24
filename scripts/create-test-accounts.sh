#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"
ACCOUNT="edenmembersd"

$CLEOS system newaccount edenmembers1 --transfer $ACCOUNT EOS5s3s1cAxBMFqTE5tDX1FtPQA3Artk4s3xMjgpbQBGBED9FM1zp --stake-net "100.00000000 WAX" --stake-cpu "100.00000000 WAX" --buy-ram-kbytes 100
