describe("Community", () => {
    beforeEach(() => {
        cy.interceptSubchain();
        cy.interceptEosApis();
        cy.viewport(1000, 1000);
        cy.visit(`/members`);
        cy.wait("@boxGetSubchain");
    });

    it("should display members", () => {
        const membersList = cy.get(`[data-testid="members-list"]`);
        membersList.should("exist");
        membersList
            .children()
            .first()
            .children()
            .find("div")
            .should("have.length.greaterThan", 0);
    });

    it("should allow to view a member profile", () => {
        cy.wait("@eosGetTableRows");

        const firstMember = cy
            .get(`[data-testid="members-list"]`)
            .children()
            .first()
            .children()
            .first();
        firstMember.click();

        const memberCard = cy.get(`[data-testid^="member-card-"]`, {
            timeout: 30000,
        });
        memberCard.should("exist");

        cy.get("head title").should("contain", `'s Profile`);

        // TODO: we should add SEO tags at some point
        // cy.get('meta[name="description"]').should('have.attr', 'content').and('match', /This is my X's profile/)
        // cy.get('meta[property="og:image"]').should('have.attr', 'content').and('match', /profile-image/)
    });
});

export {};
