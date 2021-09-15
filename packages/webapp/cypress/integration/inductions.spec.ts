describe("Inductions", () => {
    beforeEach(() => {
        cy.visit(`/induction`);
        cy.wait(1);
    });

    it("should not see the invitation button when not logged in", () => {
        const inviteButton = getInviteButton();
        inviteButton.should("not.exist");
    });

    it("should see the invitation button when logged in", () => {
        cy.login("alice.edev");

        const inviteButton = getInviteButton();
        inviteButton.should("exist");
    });

    it("should allow to invite a new member", () => {
        cy.login("alice.edev"); // TODO: we should keep sessions

        const inviteButton = getInviteButton();
        inviteButton.click();
        cy.wait(500);

        cy.get("#invitee").type("test235.edev");
        cy.get("#witness1").type("egeon.edev");
        cy.get("#witness2").type("pip.edev");
        cy.get('button[type="submit"]').click();
        cy.wait(500);

        const successMessage = cy.get("main h1");
        successMessage.should("contain", "Success!");

        cleanupInvitations();
    });
});

const getInviteButton = () => {
    return cy.get(`[data-testid="invite-button"]`);
};

const cleanupInvitations = () => {
    cy.visit(`/induction`);
    cy.wait(1);

    const inductionsAvailableForDeleting = cy.get(
        `[data-testid="cancel-induction"]`
    );
    inductionsAvailableForDeleting.click({ multiple: true });
};

export {};
