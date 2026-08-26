const CACHE_NAME = "hyeon-hangul-v15";
const APP_SHELL = ["./index.html?v=15", "./manifest.webmanifest", "./icon-512.png", "./font-patch.js?v=15", "./fonts/NanumBarunGothic.otf"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function withFontPatch(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")) return response;
  let html=await response.text();
  if(!html.includes("font-patch.js")){
    html=html.replace("</body>",'<script src="./font-patch.js?v=15"></script></body>');
  }
  const headers=new Headers(response.headers);
  headers.set("content-type","text/html; charset=utf-8");
  headers.delete("content-length");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  if(event.request.mode === "navigate"){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(event.request,{cache:"no-store"});
        const patched=await withFontPatch(fresh.clone());
        const copy=patched.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put("./index.html?v=15",copy));
        return patched;
      }catch(e){
        const cached=await caches.match("./index.html?v=15");
        return cached || caches.match("./index.html?v=13");
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
