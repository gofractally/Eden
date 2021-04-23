#!/usr/bin/env sh
set -e

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="edenmembers1"
COMMUNITY_NAME="Eden Test"
GENESIS_VIDEO="QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS"
SYMBOL="8,WAX"
MINIMUM_DONATION="10.00000000 WAX"
AUCTION_STARTING_BID="1.00000000 WAX"
AUCTION_DURATION=604800
GENESIS_MEMO="A community is born."

GENESIS_ACTION_DATA="{
    \"community\": \"$COMMUNITY_NAME\",
    \"community_symbol\": \"$SYMBOL\",
    \"minimum_donation\": \"$MINIMUM_DONATION\",
    \"initial_members\": [\"edenmember11\", \"edenmember12\", \"edenmember13\"],
    \"genesis_video\": \"$GENESIS_VIDEO\",
    \"auction_starting_bid\": \"$AUCTION_STARTING_BID\",
    \"auction_duration\": $AUCTION_DURATION,
    \"memo\": \"$GENESIS_MEMO\"
}"
echo $GENESIS_ACTION_DATA

$CLEOS push action $CONTRACT genesis "$GENESIS_ACTION_DATA" -p $CONTRACT@active
