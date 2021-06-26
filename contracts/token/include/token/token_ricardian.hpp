#pragma once

namespace token
{
   inline constexpr auto close_ricardian = R"(---
spec_version: "0.2.0"
title: Close Token Balance
summary: 'Close {{nowrap owner}}’s zero quantity balance'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/token.png#207ff68b0406eaa56618b08bda81d6a0954543f36adc328ab3065f31a5c5d654
---

{{owner}} agrees to close their zero quantity balance for the {{symbol_to_symbol_code symbol}} token.

RAM will be refunded to the RAM payer of the {{symbol_to_symbol_code symbol}} token balance for {{owner}}.)";

   inline constexpr auto create_ricardian = R"(---
spec_version: "0.2.0"
title: Create New Token
summary: 'Create a new token'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/token.png#207ff68b0406eaa56618b08bda81d6a0954543f36adc328ab3065f31a5c5d654
---

{{$action.account}} agrees to create a new token with symbol {{asset_to_symbol_code maximum_supply}} to be managed by {{issuer}}.

This action will not result any any tokens being issued into circulation.

{{issuer}} will be allowed to issue tokens into circulation, up to a maximum supply of {{maximum_supply}}.

RAM will deducted from {{$action.account}}’s resources to create the necessary records.)";

   inline constexpr auto issue_ricardian = R"(---
spec_version: "0.2.0"
title: Issue Tokens into Circulation
summary: 'Issue {{nowrap quantity}} into circulation and transfer into {{nowrap to}}’s account'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/token.png#207ff68b0406eaa56618b08bda81d6a0954543f36adc328ab3065f31a5c5d654
---

The token manager agrees to issue {{quantity}} into circulation, and transfer it into {{to}}’s account.

{{#if memo}}There is a memo attached to the transfer stating:
{{memo}}
{{/if}}

If {{to}} does not have a balance for {{asset_to_symbol_code quantity}}, or the token manager does not have a balance for {{asset_to_symbol_code quantity}}, the token manager will be designated as the RAM payer of the {{asset_to_symbol_code quantity}} token balance for {{to}}. As a result, RAM will be deducted from the token manager’s resources to create the necessary records.

This action does not allow the total quantity to exceed the max allowed supply of the token.)";

   inline constexpr auto open_ricardian = R"(---
spec_version: "0.2.0"
title: Open Token Balance
summary: 'Open a zero quantity balance for {{nowrap owner}}'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/token.png#207ff68b0406eaa56618b08bda81d6a0954543f36adc328ab3065f31a5c5d654
---

{{ram_payer}} agrees to establish a zero quantity balance for {{owner}} for the {{symbol_to_symbol_code symbol}} token.

If {{owner}} does not have a balance for {{symbol_to_symbol_code symbol}}, {{ram_payer}} will be designated as the RAM payer of the {{symbol_to_symbol_code symbol}} token balance for {{owner}}. As a result, RAM will be deducted from {{ram_payer}}’s resources to create the necessary records.)";

   inline constexpr auto retire_ricardian = R"(---
spec_version: "0.2.0"
title: Remove Tokens from Circulation
summary: 'Remove {{nowrap quantity}} from circulation'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/token.png#207ff68b0406eaa56618b08bda81d6a0954543f36adc328ab3065f31a5c5d654
---

The token manager agrees to remove {{quantity}} from circulation, taken from their own account.

{{#if memo}} There is a memo attached to the action stating:
{{memo}}
{{/if}})";

   inline constexpr auto transfer_ricardian = R"(---
spec_version: "0.2.0"
title: Transfer Tokens
summary: 'Send {{nowrap quantity}} from {{nowrap from}} to {{nowrap to}}'
icon: https://raw.githubusercontent.com/cryptokylin/eosio.contracts/v1.7.0/contracts/icons/transfer.png#5dfad0df72772ee1ccc155e670c1d124f5c5122f1d5027565df38b418042d1dd
---

{{from}} agrees to send {{quantity}} to {{to}}.

{{#if memo}}There is a memo attached to the transfer stating:
{{memo}}
{{/if}}

If {{from}} is not already the RAM payer of their {{asset_to_symbol_code quantity}} token balance, {{from}} will be designated as such. As a result, RAM will be deducted from {{from}}’s resources to refund the original RAM payer.

If {{to}} does not have a balance for {{asset_to_symbol_code quantity}}, {{from}} will be designated as the RAM payer of the {{asset_to_symbol_code quantity}} token balance for {{to}}. As a result, RAM will be deducted from {{from}}’s resources to create the necessary records.)";
}  // namespace token
