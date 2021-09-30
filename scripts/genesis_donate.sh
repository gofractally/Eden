#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://waxtest.eosn.io"
CONTRACT="test2.edev"

for PARMS in $(cat ./genesis_accounts_long_list); do
  ACCOUNT_NAME=$(echo $PARMS | cut -d "," -f1);
  INDUCTION_ID=$(echo $PARMS | cut -d "," -f2);

  QUANTITY="10.00000000 WAX"

  PAYER=$ACCOUNT_NAME
  ID=$INDUCTION_ID

  TRANSFER_ACTION_DATA="{
    \"from\": \"$PAYER\",
    \"to\": \"$CONTRACT\",
    \"quantity\": \"$QUANTITY\",
    \"memo\": \"induction-donation\"
  }"

  DONATE_ACTION_DATA="{
    \"payer\": \"$PAYER\",
    \"id\": $ID,
    \"quantity\": \"$QUANTITY\"
  }"

  $CLEOS push action eosio.token transfer "$TRANSFER_ACTION_DATA" -p $PAYER@active
  $CLEOS push action $CONTRACT inductdonate "$DONATE_ACTION_DATA" -p $PAYER@active

done;
