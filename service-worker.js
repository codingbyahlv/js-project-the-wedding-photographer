//installerar
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

//aktiverar
self.addEventListener('activate', (event) => {
  self.skipWaiting();
  console.log('Activated at ', new Date().toLocaleTimeString());
});

// triggas så fort vi gör en nätverksförfrågan/request
self.addEventListener('fetch', async (event) => {
  //console.log(event.request.url);

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
    //console.log('Online!')
    //vi kallas på vår update funktion
    const response = await updateCache(event.request);
    // och returneras svaret/responsen därifrån
    return response;
  }

  async function updateCache(request) {
    //vi gör en fetch till vår server med vår request
    const response = await fetch(request);
    //vi öppnar upp vår cache .open(med samma namn vi skapade förut)
    const cache = await caches.open('v1');
    //vi lägger till i vår cache vår req och res = vi tar en kopia av vår res "påvägen"
    cache.put(request, response.clone())
    //skickar tillbaka responsen till webbläsaren
    return response;
  }






});