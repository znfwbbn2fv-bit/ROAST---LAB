/* Offline-first: cache entire self-contained app. No external fetches. */
const CACHE = 'roast-lab-v1.0.2';
const ASSETS = ['./','./index.html','./style.css','./data.js','./app.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',ev=>{
 if(ev.request.method!=='GET'||new URL(ev.request.url).origin!==self.location.origin)return;
 ev.respondWith(caches.match(ev.request).then(cached=>cached||fetch(ev.request).then(res=>{
  if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(ev.request,copy))}return res;
 }).catch(()=>caches.match('./index.html'))));
});
