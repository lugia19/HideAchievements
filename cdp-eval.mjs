// Quick CDP helper: evaluate a JS expression in a Steam CEF target.
// Requires the .cef-enable-remote-debugging flag file in the Steam folder.
// Usage:
//   node cdp-eval.mjs                                  list all targets
//   node cdp-eval.mjs <targetTitle> <expression>       evaluate inline JS
//   node cdp-eval.mjs <targetTitle> file:<path.js>     evaluate JS from a file
// <targetTitle> matches exactly, or by prefix if unambiguous.
const [, , targetTitle, exprArg] = process.argv;

const targets = await (await fetch('http://localhost:8080/json')).json();
if (!targetTitle) {
    for (const t of targets) console.log(`${t.title || '(untitled)'}  [${t.type}]`);
    process.exit(0);
}
const expr = exprArg.startsWith('file:')
    ? await (await import('node:fs/promises')).readFile(exprArg.slice(5), 'utf8')
    : exprArg;

const target = targets.find(t => t.title === targetTitle)
    ?? targets.find(t => t.title?.startsWith(targetTitle));
if (!target) {
    console.error('Target not found. Available:', targets.map(t => t.title).join(', '));
    process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

const result = await new Promise((res, rej) => {
    ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) res(msg);
    };
    ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: expr, awaitPromise: true, returnByValue: true },
    }));
    setTimeout(() => rej(new Error('timeout')), 10000);
});

console.log(JSON.stringify(result.result, null, 2));
ws.close();
