// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

declare namespace Cypress {
    interface Chainable {
        /**
         * Logins with a specified account
         * @example cy.login('alice.edev')
         */
        login(account: string): Chainable;

        /**
         * Intercepts and creates default aliases loading up Box endpoints calls
         */
        interceptBox(): Chainable;

        /**
         * Intercepts and creates default aliases for main EOS RPC Api Calls
         */
        interceptEosApis(): Chainable;

        /**
         * Wait for blocks propagation in the blockchain
         */
        waitForBlocksPropagation(blocks: number): Chainable;
    }
}
