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

import "cypress-file-upload";

/**
 * Logins with UAL using Eden SoftKey mode
 */
Cypress.Commands.add("login", (account) => {
    cy.get(`[data-testid="signin-nav-buttonsm"]`).first().click();
    cy.wait(500);
    cy.get("#ual-box div").contains("Password").click();
    cy.wait(500);
    cy.get('#ual-box input[type="text"]').type(account);
    cy.get("#ual-box div").contains("Continue").click();
    cy.get('input[type="password"]').type(Cypress.env("test_user_pk"));
    cy.get('button[type="submit"]').click();
});

/**
 * Intercept Subchain Calls
 */
Cypress.Commands.add("interceptSubchain", () => {
    cy.intercept("**/v1/subchain/**").as("boxGetSubchain");
});

/**
 * Intercept EOS RPC API Calls
 */
Cypress.Commands.add("interceptEosApis", () => {
    cy.intercept("**/chain/get_table_rows").as("eosGetTableRows");
    cy.intercept("**/chain/push_transaction").as("eosPushTransaction");
});

/**
 * This is a wrapper around the `cy.wait()` command for now; since adding
 * `cy.wait()` should almost never be used, we actually have a genuine case
 * for that since we need to wait for blocks to read some data from the chain.
 * Also it makes our tests free of undesirable waits, if we have a new legit
 * case for `cy.wait()` we can just add a new command here.
 */
Cypress.Commands.add("waitForBlocksPropagation", (blocks = 5) => {
    cy.wait(blocks * 500);
});

export {};
