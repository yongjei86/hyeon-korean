const CACHE_NAME = "hyeon-hangul-v19";
const APP_SHELL = ["./index.html?v=19", "./manifest.webmanifest", "./icon-512.png", "./font-trace.js?v=19", "./fonts/NanumBarunGothic.otf", "./fonts/NanumBarunGothicBold.otf"];

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

async function injectTracePatch(response){
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")) return response;
  let html=await response.text();
  html=html.replace(/<script src="\.\/font-trace\.js\?v=\d+"><\/script>/g,"");
  html=html.replace("</body>",'<script src="./font-trace.js?v=19"></script></body>');
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
        const patched=await injectTracePatch(fresh.clone());
        const copy=patched.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put("./index.html?v=19",copy));
        return patched;
      }catch(e){
        const cached=await caches.match("./index.html?v=19");
        return cached || caches.match("./index.html?v=18");
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});

