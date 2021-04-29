#!/usr/bin/env sh
set -e

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="edenmembersd"
COMMUNITY_NAME="Eden Test"
COMMUNITY_DESCRIPTION="Eden is a community working to maximize the power and independence of its members and thereby securing life, liberty, property, and justice for all."
COMMUNITY_LOGO="QmZQ11KWvfj2NkKUMJfsTfvfbyUNQpLYCu8uxSbFTQ2zbA"
COMMUNITY_URL="https://eden.eoscommunity.org"
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
    \"memo\": \"$GENESIS_MEMO\",
    \"collection_attributes\": [
        {
            \"key\": \"name\",
            \"value\": [
                \"string\",
                \"$COMMUNITY_NAME\"
            ]
        },
        {
            \"key\": \"img\",
            \"value\": [
                \"string\",
                \"$COMMUNITY_LOGO\"
            ]
        },
        {
            \"key\": \"description\",
            \"value\": [
                \"string\",
                \"$COMMUNITY_DESCRIPTION\"
        ]
        },
        {
            \"key\": \"url\",
            \"value\": [
                \"string\",
                \"$COMMUNITY_URL\"
            ]
        }
    ]
}"

# cleos set account permission edenmembersd active --add-code

$CLEOS push action $CONTRACT genesis "$GENESIS_ACTION_DATA" -p $CONTRACT@active
