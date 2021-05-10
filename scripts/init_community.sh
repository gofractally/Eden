#!/usr/bin/env sh
set -e

CLEOS="cleos -u https://api.eosn.io"
CONTRACT="test.eden"
COMMUNITY_NAME="Eden (test)"
COMMUNITY_DESCRIPTION="Eden is a community working to maximize the power and independence of its members and thereby securing life, liberty, property, and justice for all."
COMMUNITY_LOGO="QmTdqD57JmfZyNjW8HatpgjbhTh4UjtTPXtievRqCnwMF4"
COMMUNITY_URL="https://eden.eoscommunity.org"
GENESIS_VIDEO="QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS"
SYMBOL="4,EOS"
MINIMUM_DONATION="0.0001 EOS"
AUCTION_STARTING_BID="0.0001 EOS"
AUCTION_DURATION=604800
GENESIS_MEMO="A community is put through the test"
GENESIS_MEMBERS='"doingitright","mikemanfredi","toddbfleming","thomhallgren","domenic.gm","energy.gm"'

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
