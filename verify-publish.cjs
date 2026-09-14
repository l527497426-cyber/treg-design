const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve('dist'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
 if(/type="(module|importmap|application\/ld\+json)"/.test(match[1])||/src=/.test(match[1]))continue;
 new vm.Script(match[2]);
}
for(const match of html.matchAll(/(?:src|href)="([^"{}]+)"/g)){
 const p=match[1];if(/^(https?:|#|data:)/.test(p)||p.startsWith('/app.html')||p.startsWith('/#'))continue;
 const target=p.startsWith('/')?path.join(root,p):path.join(root,'landing',p);
 assert(fs.existsSync(target),'Missing runtime asset: '+p);
}
assert.equal(fs.readFileSync('index.html','utf8'),fs.readFileSync('dist/app.html','utf8'));
assert(html.includes("location.href='/app.html#start'"));
assert(html.includes('href="/app.html#catalog"'));
for(const hash of ['#start','#catalog','#/catalog','#connections'])assert(/^#\/?(?:start|catalog|connections)(?:[?&/]|$)/.test(hash));
assert(!/^#\/?(?:start|catalog|connections)(?:[?&/]|$)/.test('#top'));
console.log('PASS: scripts parse, landing assets present, existing app unchanged, login and legacy/catalog routes connected.');
