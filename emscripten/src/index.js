import { Api, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();
window.addEventListener('resize', () => fitAddon.fit());
function writeTerm(s) {
    term.write(s.replace(/\r\n?|\n/g, '\r\n'));
}

let testerOptions = {
    printErr(s) { writeTerm(s + '\n'); }
};

const defaultPubKey = "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV";
const defaultPrivKey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
const defaultSignatureProvider = new JsSignatureProvider([defaultPrivKey]);


function simpleAuth(key = defaultPubKey) {
    return {
        threshold: 1,
        keys: [{ key, weight: 1 }],
        accounts: [],
        waits: []
    };
}

function createAccount(name) {
    return {
        account: 'eosio',
        name: 'newaccount',
        authorization: [{
            actor: 'eosio',
            permission: 'active',
        }],
        data: {
            creator: 'eosio',
            name: 'bob',
            owner: simpleAuth(),
            active: simpleAuth(),
        },
    };
}

(async () => {
    try {
        await (async () => {
            let t = await createCLTester(testerOptions);
            let c = await t.createChain();
            writeTerm(JSON.stringify(await c.get_info(), null, 4) + '\n');
            let api = new Api({ rpc: c, signatureProvider: defaultSignatureProvider });
            await api.transact({
                actions: [
                    createAccount('alice'),
                    createAccount('bob'),
                    createAccount('sue'),
                ]
            }, { useLastIrreversible: true, expireSeconds: 1 });
            while (true)
                await c.finishBlock();
        })();
    } catch (e) {
        writeTerm(e + '\n');
    }
})();
