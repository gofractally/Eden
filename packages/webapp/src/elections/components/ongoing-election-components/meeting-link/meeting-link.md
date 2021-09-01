# `<MeetingLink />`

## Notes

-   This button component should always be mounted, only hiding itself internally when required.
-   Nothing should render during post-meeting stage.

## Supported user flows

### Flow 1: No meeting link, user DOES NOT have Zoom JWT

When round participants enter pre-round, the race is on to create, encrypt and commit a zoom meeting link. This can be done pre-meeting or during-meeting while no link exists.

1. Use sees "Sign in with Zoom" button.
2. SEE: [Password sub-flows](#password-sub-flows) if user does not already have a password set and/or in-browser.
3. When user clicks OK button in password confirmation (if applicable), the modal displays a "Create meeting link" screen that says:
    > Sign in with your Zoom account to create a meeting link for participants in this round. After you sign in, you will be redirected back to the ongoing election.
4. When user clicks "Link Zoom account" button, they're redirected to Zoom Oauth.
5. User completes permissions for zoom and is redirected to our `/oauth/zoom` page where they see a friendly message telling them to hold on while redirecting to the Election page.
6. When user returns to the page, the button now says "Get meeting link".
    - If another user in the group finished creating the link before this user redirects:
        - if the round is in the pre-round stage, the button will say "Join Meeting" and will be disabled with a message above it saying: "Join meeting link will become active when the round starts."
        - if the round is in the meeting stage, the button will say "Join meeting" and will be enabled with a message above it saying: "The round has started, join your meeting." (When the user clicks that, they'll join the Zoom room.)
7. If no meeting link has been set up yet for the group, the user will be presented with a modal informing them they are going to set up a meeting link and they "may" be asked to sign a message preparing the link.
8. When the user confirms:
    - If a link has been set up by someone else in the group by this point, the transaction will be skipped and they'll be given a "Success!" screen saying:
        > A meeting link has been created for your group. Dismiss this message and look for the "Join meeting" button on the election screen.
    - If not, they will be asked to sign a transaction committing the encrypted link on the chain.
    - If that transaction fails because someone else beat the user to it, the transaction will fail silently and present the same "Success!" screen.
9. When they dismiss the Success message, they're returned to the election screen where they see the Join meeting button.
10. SEE: [Flow 4: Happy path](#flow-4-happy-path---meeting-and-password-exist)

### Flow 2: No meeting link, user HAS Zoom JWT

1. SEE: [Password sub-flows](#password-sub-flows) if user does not already have a password set and/or in-browser.
2. Start at #6 in [Flow 1 above](#flow-1-no-meeting-link-user-does-not-have-zoom-jwt).

### Flow 3: Meeting link exists

In a round in this state, an arriving user will not be asked at all to sign in with Zoom.

1. SEE: [Password sub-flows](#password-sub-flows) if user does not already have a password set and/or in-browser.
2. SEE: [Flow 4: Happy path](#flow-4-happy-path---meeting-and-password-exist)

### Flow 4: Happy path - meeting and password exist

-   If meeting link exists on chain for that group, component will silently decrypt the meeting link. Assuming success:
    -   Before meeting, component will display text "Join meeting button activates when round starts." Button displays: "Join meeting" in a disabled state.
    -   After meeting begins, button displays "Join meeting" in an enabled state.

### Flow 5: Sad path - meeting link exists, then user creates or resets password

If the user has no password set at all, they will see disabled "Join meeting" button with red warning text below:

> Could not get meeting link for this round. Reach out to others in your group via Telegram or otherwise to ask for the meeting link. Click the banner above to create an election password so you can access the meeting link in the next round.

If user has a password set but they've forgotten it, they'll see a "Get meeting link" button, which, when they click will:

1. SEE: [Password sub-flows](#password-sub-flows)
1. When user clicks OK button on confirmation, modal dismisses. User sees disabled "Join meeting" button with red warning text below:

> Could not get meeting link for this round. Reach out to others in your group via Telegram or otherwise to ask for the meeting link.

## Password sub-flows

### Password re-entry

1. User clicks button
1. "Provide your election password" modal pops up
1. User enters password and submits
1. Modal displays success step
1. User clicks OK button

-   Modal cannot be dismissed via ESC or tap-on-overlay

### Password reset

Any time the user is prompted to enter their password, they are given the option to reset their password if they've forgotten it. When this is done during an election via this component, the password reset screen will display additional text:

> **IMPORTANT**: Your new password will not work for the current election round already underway; only _future_ rounds. For this round, reach out to others in your group via Telegram or otherwise to ask for the meeting link.

When the user resets their password, the modal will dismiss OR move on to the next step.

### Password creation

This is the same as the Password reset sub-flow with modified text. The same additional text displays.
