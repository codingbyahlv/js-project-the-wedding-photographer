/* INSTALLERAR SW */
// - öppna en ny cache
// - gör så den cachar en del filer inititalt
// - skipWaiting
// - logga att SW är installerad
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1')
      .then((cache) => {
        return cache.addAll(['offline-index.html', 'styles/style.css', 'index.html', 'index.js'])
      })
  )
  self.skipWaiting();
  console.log('Installed service worker at ', new Date().toLocaleTimeString());
});


/* AKTIVERAR SW */
// - SkipWaiting
// - logga att SW är aktiverad
self.addEventListener('activate', (event) => {
  self.skipWaiting();
  console.log('Activated at ', new Date().toLocaleTimeString());
});


/* VID VARJE REQUEST */
// triggas så fort vi gör en nätverksförfrågan/request
// - OM (inte online)
//      - logga offline
//      - respondWith
//        - se om det finns matchande request i cachen
//        - OM det finns match
//            - returnera den
//        - ANNARS 
//            - returnera egen offlinefil
// - ANNARS
//      - kalla på funktion updateCache(nya requesten)
//      - returnera responsen vi fått från funktionen
self.addEventListener('fetch', async (event) => {
  if(!navigator.onLine){
    console.log('Offline!')
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if(response){
            return response
          } else {
            return caches.match(new Request('offline-index.html'))
          }
        })
    )
  } else {
    const response = await updateCache(event.request);
    return response;
  }


  /* UPPDATERA CACHE */
  // - vi gör en request och lagrar responsen
  // - öppna upp vår cache vi tidigare skapat
  // - lägg i vår request/response = ta en "kopia" på vägen
  // - skickar tillbaka responsen till webbläsaren
  async function updateCache(request) {
    const response = await fetch(request);
    const cache = await caches.open('v1');
    if (request.method === 'GET') {
      cache.put(request, response.clone())
       return response;
    }
  }
});

