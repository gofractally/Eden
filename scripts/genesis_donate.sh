#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="test2.edev"

for PARMS in $(cat ./genesis_accounts); do
  ACCOUNT_NAME=$(echo $PARMS | cut -d "," -f1);
  INDUCTION_ID=$(echo $PARMS | cut -d "," -f2);
  IMAGE=$(echo $PARMS | cut -d "," -f3);
  NAME="Test Member $INDUCTION_ID"
  BIO="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sagittis, nulla laoreet vulputate pharetra, eros ex finibus urna, ut semper neque eros eget turpis. Proin semper fringilla lobortis. Phasellus quis sapien nec dolor porta feugiat in eget augue. Etiam porta dolor sed leo tristique mattis sollicitudin sed neque. Proin in iaculis nunc. Integer placerat suscipit malesuada. Nunc pretium in urna ac gravida. Nulla in velit dignissim, bibendum est ut, auctor enim. Vestibulum non aliquet turpis. Etiam mattis, urna id scelerisque aliquet, nibh turpis pulvinar odio, sed tincidunt nisi libero et sem. Integer ultrices, nulla a sollicitudin efficitur, turpis ipsum semper ipsum, et efficitur leo est ut leo. Suspendisse massa ex, venenatis pretium nulla ut, sodales sagittis lectus."

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