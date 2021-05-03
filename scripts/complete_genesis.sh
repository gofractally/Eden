#!/usr/bin/env sh
set -xe

CLEOS="cleos -u https://wax-test.eosdac.io"
CLEOS="cleos -u https://wax-test.eosdac.io"
CONTRACT="edenmembersd"

INVITEE="alice.edev"
INDUCTION_ID="1"
NAME="Alice"
IMAGE="QmS3APm68mAcgMtisdVb5UDZKU4PocZypT6N3TVMP7LBC2"
BIO="Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, \\\"and what is the use of a book,\\\" thought Alice \\\"without pictures or conversations?\\\""
SOCIAL_EOSCOMMUNITY="alice.edev"
SOCIAL_TWITTER="alice.edev"
SOCIAL_LINKEDIN="alice.edev"
SOCIAL_TELEGRAM="alice.edev"
SOCIAL_FACEBOOK="alice.edev"
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

INVITEE="pip.edev"
INDUCTION_ID="2"
NAME="Philip Pirrip"
IMAGE="QmYyE1WyjRs3evRLA31EyUAEjQygxhpHHC3d1uBY4kx8m4"
BIO="My father's family name being Pirrip and my Christian name Phillip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip and came to be called Pip."
SOCIAL_EOSCOMMUNITY="pip.edev"
SOCIAL_TWITTER="pip.edev"
SOCIAL_LINKEDIN="pip.edev"
SOCIAL_TELEGRAM="pip.edev"
SOCIAL_FACEBOOK="pip.edev"
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

INVITEE="egeon.edev"
INDUCTION_ID="3"
NAME="Egeon"
IMAGE="QmQGTY1cdwQ1jgBzNMY2rCk3geEKLUwWCXx8UtPKfodQub"
BIO="In Syracusa was I born, and wed. Unto a woman happy but for me, And by me, had not our hap been bad. With her I liv'd in joy; our wealth increas'd By prosperous voyages I often made To Epidamnum, till my factor's death,"
SOCIAL_EOSCOMMUNITY="egeon.edev"
SOCIAL_TWITTER="egeon.edev"
SOCIAL_LINKEDIN="egeon.edev"
SOCIAL_TELEGRAM="egeon.edev"
SOCIAL_FACEBOOK="egeon.edev"
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
