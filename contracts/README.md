# EdenOS Contracts

## Updating Contracts on WAX Testnet

In this example, we'll assume you're updating the contract running under the `test2.edev` EOS account and are using the `test2.edev` AtomicAssets collection name. You will need the `active` private key for the `test2.edev` account present in your cleos wallet.

Tip: bloks.io can give you the most up-to-date JSON for executing actions if you "log in" with their cleos "integration." (It will give you cleos commands to copy and paste.)

### The Process

1. Unlock your wallet: `cleos wallet unlock`
2. Clear out the current contract tables using the `test2.edev::clearall` action:

```sh
cleos -u https://testnet.waxsweden.org push transaction '{
  "delay_sec": 0,
  "max_cpu_usage_ms": 0,
  "actions": [
    {
      "account": "test2.edev",
      "name": "clearall",
      "data": {},
      "authorization": [
        {
          "actor": "test2.edev",
          "permission": "active"
        }
      ]
    }
  ]
}'
```

3. Download the latest, built version of the contract WASM and ABI files from Github CI/CD.
4. Deploy the WASM code: `cleos -u https://testnet.waxsweden.org set code test2.edev ./eden.wasm`
5. Set the ABI: `cleos -u https://testnet.waxsweden.org set abi test2.edev ./eden.abi`
6. If you want, customize the community initialization parameters in the `scripts/init_community.sh` file. Make sure that the `CONTRACT` param is set properly (in this case, it would be `test2.edev`.) Also consider shortening the list of `GENESIS_MEMBERS` unless you're testing a full genesis induction slate.
7. Initialize the genesis group of the community by executing the `scripts/init_community.sh` file: `./init_community.sh`

That's it! The community is live!

### Other Considerations

#### Point Frontend to the Right Contract & Collection!

In this case, your environment variables should be set accordingly:

```
NEXT_PUBLIC_AA_COLLECTION_NAME="test2.edev"
NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT="test2.edev"
```

See [Setting Environment Variables](../packages/webapp/README.md).

#### Filtering Out Previous NFTs

If the case of `test2.edev`, because we've used it for previous iterations of the test community, there will be many pre-existing member NFTs. So that they do not all show up in the UI, set the `NEXT_PUBLIC_AA_FETCH_AFTER` environment variable in your `.env.local` file to the approximate UNIX timestamp, in milliseconds, of the new contract deployment. (\_E.g., `NEXT_PUBLIC_AA_FETCH_AFTER="1626286021000"`.)

### Need More RAM?

When executing the `set code`, you may find that you need more RAM. This command will come in handy for that: `cleos -u https://testnet.waxsweden.org system buyram -k test2.edev test2.edev 512`. Set the last argument (`512`) accordingly.
