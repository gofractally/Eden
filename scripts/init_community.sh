#!/usr/bin/env sh
set -e

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="test2.edev"

for PARMS in $(cat ./genesis_accounts); do
  ACCOUNT_NAME=$(echo $PARMS | cut -d "," -f1);
  INDUCTION_ID=$(echo $PARMS | cut -d "," -f2);
  IMAGE=$(echo $PARMS | cut -d "," -f3);
  GENESIS_MEMBERS="$GENESIS_MEMBERS, \"$ACCOUNT_NAME\""
done
GENESIS_MEMBERS=$(echo $GENESIS_MEMBERS | cut -c 3-)
GENESIS_MEMBERS="'$GENESIS_MEMBERS'"

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
ELECTION_DAY="0"
ELECTION_TIME="16:00"

GENESIS_ACTION_DATA="{
    \"community\": \"$COMMUNITY_NAME\",
    \"community_symbol\": \"$SYMBOL\",
    \"minimum_donation\": \"$MINIMUM_DONATION\",
    \"initial_members\": [$GENESIS_MEMBERS],
    \"genesis_video\": \"$GENESIS_VIDEO\",
    \"auction_starting_bid\": \"$AUCTION_STARTING_BID\",
    \"auction_duration\": $AUCTION_DURATION,
    \"memo\": \"$GENESIS_MEMO\",
    \"election_day\": \"$ELECTION_DAY\",
    \"election_time\": \"$ELECTION_TIME\",
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
