const CACHE='rugby-iq-v3.1-simulator-1';
const FILES=['./','./index.html','./style.css','./app.js','./questions.js','./config.js','./manifest.webmanifest','./privacy.html','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k==='mir-shell-v15'||(k.startsWith('rugby-iq-')&&k!==CACHE)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const request=event.request, url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return; // Nunca cachear Supabase, otros dominios ni solicitudes POST.
 event.respondWith(fetch(request).then(response=>{
   if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(request,clone)).catch(()=>{});}
   return response;
 }).catch(async()=>{
   const hit=await caches.match(request);
   if(hit)return hit;
   if(request.mode==='navigate')return caches.match('./index.html');
   return Response.error();
 }));
});
