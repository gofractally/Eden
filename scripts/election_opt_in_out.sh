#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"

CONTRACT="test2.edev"
PARTICIPATING=true
SET_PUB_KEY=true
PUB_KEY="PUB_K1_6aB7nuqWvrD4oKEi6pcr3PRis9UiMoRKmkQRKT7MF9jyxhEaxQ"

# PUBLIC KEY:
  # PUB_K1_6aB7nuqWvrD4oKEi6pcr3PRis9UiMoRKmkQRKT7MF9jyxhEaxQ
  # EOS6aB7nuqWvrD4oKEi6pcr3PRis9UiMoRKmkQRKT7MF9jyutesMh
# PRIVATE KEY:
  # PVT_K1_pVwv4xcJdkKweWE6Ba1hPwUUDcu6EsM56t7pXJkh89kk5Wn1s
  # 5JdnXbX3gmCjax2nGHdU6k94h53Y7E6x4tAfLza3zZynvHQzCWw

for PARMS in $(cat ./genesis_accounts); do
  ACCOUNT_NAME=$(echo $PARMS | cut -d "," -f1);

  AUTHORIZATION="[{
    \"actor\": \"$ACCOUNT_NAME\",
    \"permission\": \"active\"
  }]"

  ELECTOPT_ACTION_DATA="{
    \"member\": \"$ACCOUNT_NAME\",
    \"participating\": $PARTICIPATING
  }"

  ELECTOPT_ACTION="{
    \"account\": $CONTRACT,
    \"name\": \"electopt\",
    \"authorization\": $AUTHORIZATION,
    \"data\": $ELECTOPT_ACTION_DATA
  }"

  SETENCPUBKEY_ACTION_DATA="{
    \"account\": \"$ACCOUNT_NAME\",
    \"key\": \"$PUB_KEY\"
  }"

  SETENCPUBKEY_ACTION="{
    \"account\": $CONTRACT,
    \"name\": \"setencpubkey\",
    \"authorization\": $AUTHORIZATION,
    \"data\": $SETENCPUBKEY_ACTION_DATA
  }"


  if [ "$SET_PUB_KEY" = true ] ; then
    $CLEOS push transaction "{
      \"actions\": [$ELECTOPT_ACTION, $SETENCPUBKEY_ACTION]
    }"
  else
    $CLEOS push transaction "{
      \"actions\": [$ELECTOPT_ACTION]
    }"
  fi

done;

