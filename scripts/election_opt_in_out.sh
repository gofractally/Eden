#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://waxtest.eosn.io"

CONTRACT="test2.edev"
PARTICIPATING=true
SET_PUB_KEY=true
PUB_KEY="EOS676NTBDHP5dTZW8KftWfj5YtU5HUcFd4MsGrSJdTiVpn1RV7Lm"

# PUBLIC KEY: EOS676NTBDHP5dTZW8KftWfj5YtU5HUcFd4MsGrSJdTiVpn1RV7Lm
# PRIVATE KEY: 5JuyKTpt9xrD5shspHJRC5qNwku8yEREt1UeUBB5hLxbU7S3Fvq
# PASSWORD: %yCLM7RDwidC

for PARMS in $(cat ./genesis_accounts_long_list); do
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

