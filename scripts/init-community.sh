#!/usr/bin/env sh
set -e

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="edenmembersd"
COMMUNITY_NAME="Eden Test"
GENESIS_VIDEO="QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS"
SYMBOL="8,WAX"
MINIMUM_DONATION="10.00000000 WAX"
AUCTION_STARTING_BID="1.00000000 WAX"
AUCTION_DURATION=604800
GENESIS_MEMO="A community is born."
GENESIS_MEMBERS='"alice.edev", "pip.edev", "egeon.edev"'
# full 20 members simulation
# GENESIS_MEMBERS='"alice.edev", "pip.edev", "egeon.edev","edenmember11", "edenmember12", "edenmember13", "edenmember14", "edenmember15","edenmember21", "edenmember22", "edenmember23", "edenmember24", "edenmember25","edenmember31", "edenmember32", "edenmember33", "edenmember34", "edenmember35","edenmember41", "edenmember42"'

GENESIS_ACTION_DATA="{
    \"community\": \"$COMMUNITY_NAME\",
    \"community_symbol\": \"$SYMBOL\",
    \"minimum_donation\": \"$MINIMUM_DONATION\",
    \"initial_members\": [$GENESIS_MEMBERS],
    \"genesis_video\": \"$GENESIS_VIDEO\",
    \"auction_starting_bid\": \"$AUCTION_STARTING_BID\",
    \"auction_duration\": $AUCTION_DURATION,
    \"memo\": \"$GENESIS_MEMO\"
}"
echo $GENESIS_ACTION_DATA

# cleos set account permission edenmembersd active --add-code

$CLEOS push action $CONTRACT genesis "$GENESIS_ACTION_DATA" -p $CONTRACT@active
