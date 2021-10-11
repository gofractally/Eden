describe("Inductions", () => {
    beforeEach(() => {
        cy.interceptSubchain();
        cy.interceptEosApis();
        cy.visit(`/induction`);
        cy.wait("@boxGetSubchain");
        cy.wait("@eosGetTableRows");
    });

    it("should not see the invitation button when not logged in", () => {
        const inviteButton = getInviteButton();
        inviteButton.should("not.exist");
    });

    it("should see the invitation button when logged in", () => {
        cy.login("alice");

        const inviteButton = getInviteButton();
        inviteButton.should("exist");
    });

    describe("inviting a new member", () => {
        const participants = {
            inviter: "alice",
            invitee: "bertie",
            witness1: "pip",
            witness2: "egeon",
        };

        it("should allow to invite a new member", () => {
            cy.login(participants.inviter);

            const inviteButton = getInviteButton();
            inviteButton.click();

            cy.get("#invitee").type(participants.invitee);
            cy.get("#witness1").type(participants.witness1);
            cy.get("#witness2").type(participants.witness2);
            cy.get('button[type="submit"]').click();
            cy.wait("@eosPushTransaction");

            const successMessage = cy.get("main h1");
            successMessage.should("contain", "Success!");
            cy.waitForBlocksPropagation();
        });

        it("should be able to input induction data", () => {
            cy.login(participants.invitee);

            cy.contains("Create my profile").click();

            cy.get("#name").type("Cypress Smith");
            cy.get("#imgFile").attachFile("cypress-avatar.jpg");
            cy.get("#attributions").type("Cypress Framework");
            cy.get("#bio").type("Thanks to Cypress I'm here!");
            cy.get("#eosCommunity").type(participants.invitee + ".ec");
            cy.get("#telegram").type(participants.invitee + ".tg");
            cy.get("#linkedin").type(participants.invitee + ".li");
            cy.get("#twitter").type(participants.invitee + ".tw");
            cy.get("#blog").type(
                participants.invitee + ".example.com/supercool"
            );
            cy.get("#facebook").type(participants.invitee + ".fb");

            cy.get("button").contains("Preview My Profile").click();

            cy.get("#image").click();
            cy.get("#statement").click();
            cy.get("#links").click();
            cy.get("#handles").click();
            cy.get("#consent").click();

            cy.get("button").contains("Submit Profile").click();
            cy.wait("@eosPushTransaction");

            const successMessage = cy.get("main h1");
            successMessage.should("contain", "Success!");
            cy.waitForBlocksPropagation();
        });

        it("should be able to endorse with witness 1", () => {
            cy.login(participants.witness1);

            cy.contains("Complete ceremony").click();

            cy.get("#videoFile0").attachFile("fake-induction.mp4");
            cy.get("button").contains("Upload meeting").click();

            cy.contains("Onward!", { timeout: 10000 }).click();

            endorseInvitee();
        });

        it("should be able to endorse with witness 2", () => {
            cy.login(participants.witness2);

            cy.contains("Review & endorse").click();

            endorseInvitee();
        });

        it("should be able to endorse with inviter", () => {
            cy.login(participants.inviter);

            cy.contains("Review & endorse").click();

            endorseInvitee();
        });

        it("should be able to complete induction", () => {
            cy.login(participants.invitee);

            cy.contains("Donate & complete").click();

            cy.get("#reviewed").click();

            // Todo: Uncomment when put a system to generate random accounts
            // for every new induction test
            // cy.get("button").contains("Donate").click();
            // cy.wait("@eosPushTransaction");
        });

        const endorseInvitee = () => {
            cy.get("#photo").click();
            cy.get("#links").click();
            cy.get("#video").click();
            cy.get("#reviewed").click();
            cy.get("button").contains("Endorse").click();
            cy.wait("@eosPushTransaction");
        };

        after(() => {
            cleanupInvitations();
        });

        const cleanupInvitations = () => {
            cy.visit(`/induction`);
            cy.login(participants.inviter);

            const inductionsAvailableForDeleting = cy.get(
                `[data-testid="cancel-induction"]`
            );
            inductionsAvailableForDeleting.click({ multiple: true });
            cy.wait("@eosPushTransaction");
        };
    });
});

const getInviteButton = () => {
    return cy.get(`[data-testid="invite-button"]`);
};

export {};
