describe("Community", () => {
    beforeEach(() => {
        cy.visit(`/members`);
        cy.wait(1);
    });

    it("should display members", () => {
        const newMembersGrid = cy.get(`[data-testid="new-members-grid"]`);
        expect(newMembersGrid).to.exist;
        const membersGrid = cy.get(`[data-testid="members-grid"]`);
        expect(membersGrid).to.exist;
        membersGrid.find("a").should("have.length.greaterThan", 0);
    });

    it("should allow to view a member profile", () => {
        const firstMember = cy
            .get(`[data-testid="members-grid"]`)
            .children()
            .first();
        firstMember.click();

        const memberCard = cy.get(`[data-testid^="member-caaard-"]`);
        expect(memberCard).to.exist;

        cy.get("head title").should("contain", `'s Profile`);

        // TODO: we should add SEO tags at some point
        // cy.get('meta[name="description"]').should('have.attr', 'content').and('match', /This is my X's profile/)
        // cy.get('meta[property="og:image"]').should('have.attr', 'content').and('match', /profile-image/)
    });
});

export {};
