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

(async () => {
    let t = await createCLTester({
        printErr(s) { term.write(s + '\r\n'); }
    });
    let c = await t.createChain();
    while (true) {
        await c.finishBlock();
    }
})();
