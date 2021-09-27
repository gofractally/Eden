describe("Community", () => {
    beforeEach(() => {
        cy.visit(`/members`);
        cy.interceptEosApis();
    });

    it("should display members", () => {
        const newMembersGrid = cy.get(`[data-testid="new-members-grid"]`);
        newMembersGrid.should("exist");
        const membersGrid = cy.get(`[data-testid="members-grid"]`);
        membersGrid.should("exist");
        membersGrid.find("div").should("have.length.greaterThan", 0);
    });

    it("should allow to view a member profile", () => {
        cy.wait("@eosGetTableRows");

        const firstMember = cy
            .get(`[data-testid="members-grid"]`)
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
