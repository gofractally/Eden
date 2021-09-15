// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (account) => {
    cy.get(`[data-testid="signin-nav-buttonsm"]`).first().click();
    cy.wait(500);
    cy.get("#ual-box div").contains("Password").click();
    cy.wait(500);
    cy.get('#ual-box input[type="text"]').type(account);
    cy.wait(500);
    cy.get("#ual-box div").contains("Continue").click();
    cy.wait(500);
    cy.get('input[type="password"]').type(Cypress.env("test_users_pk"));
    cy.get('button[type="submit"]').click();
    cy.wait(500);
});

export {};
