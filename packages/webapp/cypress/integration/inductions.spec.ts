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

    it("should allow to invite a new member", () => {
        cy.login("alice"); // TODO: we should keep sessions

        const inviteButton = getInviteButton();
        inviteButton.click();

        cy.get("#invitee").type("bertie");
        cy.get("#witness1").type("egeon");
        cy.get("#witness2").type("pip");
        cy.get('button[type="submit"]').click();
        cy.wait("@eosPushTransaction");

        const successMessage = cy.get("main h1");
        successMessage.should("contain", "Success!");
        cy.waitForBlocksPropagation();

        cleanupInvitations();
    });
});

const getInviteButton = () => {
    return cy.get(`[data-testid="invite-button"]`);
};

const cleanupInvitations = () => {
    cy.visit(`/induction`);

    const inductionsAvailableForDeleting = cy.get(
        `[data-testid="cancel-induction"]`
    );
    inductionsAvailableForDeleting.click({ multiple: true });
    cy.wait("@eosPushTransaction");
};

export {};
