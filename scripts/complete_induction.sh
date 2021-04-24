#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="edenmembers1"

INVITEE="edenmember11"
INDUCTION_ID="3"
NAME="Sparky"
IMAGE="Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws"
BIO="Sparking Freedom!"
SOCIAL_EOSCOMMUNITY="sparkplug0025"
SOCIAL_TWITTER="sparkplug0025"
SOCIAL_LINKEDIN="sparkplug0025"
SOCIAL_TELEGRAM="sparkplug0025"
SOCIAL_FACEBOOK="sparkplug0025"
SOCIAL_BLOG="moreequalanimals.com"

PROFILE_ACTION_DATA="{
  \"id\": $INDUCTION_ID,
  \"new_member_profile\": {
    \"name\": \"$NAME\",
    \"img\": \"$IMAGE\",
    \"bio\": \"$BIO\",
    \"social\": \"{\\\"eosCommunity\\\":\\\"$SOCIAL_EOSCOMMUNITY\\\",\\\"twitter\\\":\\\"$SOCIAL_TWITTER\\\",\\\"linkedin\\\":\\\"$SOCIAL_LINKEDIN\\\",\\\"telegram\\\":\\\"$SOCIAL_TELEGRAM\\\",\\\"facebook\\\":\\\"$SOCIAL_FACEBOOK\\\",\\\"blog\\\":\\\"$SOCIAL_BLOG\\\"}\"
  }
}"

$CLEOS push action $CONTRACT inductprofil "$PROFILE_ACTION_DATA" -p $INVITEE@active
