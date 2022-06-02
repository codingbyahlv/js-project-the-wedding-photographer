const API_KEY = '$2b$10$yW3fxf3SBSr.INGd5k9.qOK.2PnvlpAj2aWBcvRfui9vcAurz2HN6'

const introPage = document.querySelector("#intro-page-section");
const headerElem = document.querySelector("#header-wrapper");
const mainElem = document.querySelector("#main-wrapper");

const noticeBtn = document.querySelector("#turn-on-off-notice-btn");
let noticePermission;
const menuBtn = document.querySelector("#menu-btn");
let galleryOpen = false;

const takePhotoElem = document.querySelector("#take-photo-section");
const video = document.querySelector("#camera");
const takePhotoBtn = document.querySelector("#take-photo-btn");

const yourPhotoElem = document.querySelector("#your-photo-section");
const canvas = document.querySelector("#picture");
const newPhotoBtn = document.querySelector("#new-photo-btn");

const galleryElem = document.querySelector("#gallery-section")
const gallery = document.querySelector("#gallery");
const removeBtn = document.querySelector("#remove-btn")
const updateGalleryBtn = document.querySelector("#update-gallery-btn")

const ctx = canvas.getContext('2d');
let stream;
let imgArray = [];


/* VIEW - VISA TAGEN BILD */
function openYourPhoto() {
    takePhotoElem.style.display = "none";
    yourPhotoElem.style.display = "flex";
}


/* VIEW - TA NY BILD */
function openTakePhoto() {
    takePhotoElem.style.display = "flex";
    headerElem.style.display = "flex";
    mainElem.style.display = "flex";
    yourPhotoElem.style.display = "none";
    introPage.style.display = "none";
}


/* TILLBAKA TILL KAMERAN */
// - onclick för att öppna funktionen för att ta en ny bild
newPhotoBtn.addEventListener('click', () => openTakePhoto());


/* SPARAR NY BILD I LS (ny bild fr. onklick på "ta bild-knapp")*/
// - OM (online)
//      - hämta/uppdatera arrayen med senaste från json bin
// - ANNARS 
//      - hämta LS arrayen
// - pusha in nya bilden
// - arrayen spara till LS
// - kalla på notis
async function savePhoto(newPhoto) {
    const imagesFromLs = JSON.parse(localStorage.getItem('weddingGallery'));
    if(navigator.onLine){
        await syncBin()
        imgArray = await getPhotosFromBin();
    } else {
        imgArray = [...imagesFromLs]
    }
    imgArray.push({image: newPhoto});
    localStorage.setItem('weddingGallery', JSON.stringify(imgArray));
    createNotification ('Ditt foto är sparat!');
}


/* TA BILDEN VID KLICK */
// - onclick på ta kort knappen
// - rita upp bilden
// - lagra bilden i en variabel och sätt formatet
// - kalla på funktion för att visa tagen bild
// - kalla på funktion för att spara bilden
takePhotoBtn.addEventListener('click', () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const newImageData = canvas.toDataURL('image/png'); 
    openYourPhoto();
    savePhoto(newImageData);
});


/* TA BORT KLICKAD BILD */
// - OM (online)
//      - se om det finns ej synkade bilder från LS
//      - hämta/uppdatera arrayen med senaste från BIN
// - ANNARS
//      - hämta LS arrayen
// - filtrera ut (och lägg i ny array) alla som inte matchar inskickad bild
// - spara nya arrayen i LS
// - kalla på notis(texten vi vill skriva ut)
// - kalla på loadPhotos()
async function removeImage(inImage){
    let updatedArray = [];
    if(navigator.onLine){
        await syncBin()
        updatedArray = await getPhotosFromBin();
    } else {
        updatedArray = JSON.parse(localStorage.getItem('weddingGallery'));
    }
    updatedArray = updatedArray.filter((image) => {
        if (image.image !== inImage) {
            return image;
        }
    })
    localStorage.setItem('weddingGallery', JSON.stringify(updatedArray));
    createNotification ('Ditt foto är raderat')
    loadPhotos();
};


/* VIEW - SKAPAR GALLERIET (bildarray fr. loadPhotos)*/
// - töm ev kvarvarande bilder
// - mappa ut alla bilder i arrayen inkl onclick(bildens data) för att ta bort
function createGallery(images){
    gallery.innerHTML = '';
    gallery.innerHTML = images
        .map((image) => 
            `<div class="image-wrapper">
                <img class="gallery-img" src="${image.image}" />
                <button id="remove-btn" onclick="removeImage('${image.image}')"><span class="iconify trash" data-icon="fa:trash"></span></button> 
            </div>`)
        .join("");
};


/* HÄMTAR BILDERNA JSON BIN */
// - kör fetch mot BIN och skicka med nyckel
// - lagra responsen i variabel
// - returnera det som hämtats
async function getPhotosFromBin() {
    const response = await fetch('https://api.jsonbin.io/b/6290ee9d449a1f3821f1ce1d/latest', {
        headers: {
          'X-Master-Key': API_KEY,
        }
    });
    const imagesFromBin = await response.json();
    return imagesFromBin.images;
};


/* SYNKA MOT JSON BIN */
// - hämta senaste från BIN
// - hämta senaste från LS
// - spinner för väntan
// - OM det finns bilder i LS
//      - ta kopia på LS och lägg i BIN
// - kör fetchen där hela den nya imagesBin skickas som body
// - ta emot responsen
// - OM lyckad sync
//       - logga lyckat synk
// - ANNARS
//      - logga misslyckat synk
async function syncBin() {
    console.log('Dina bilder synkas...')
    gallery.innerHTML = '<span class="spinner"><i class="fa fa-spinner fa-spin"></i></span>'
    let imagesBin = await getPhotosFromBin()
    const imagesLs = JSON.parse(localStorage.getItem('weddingGallery'));
    if (imagesLs){
        imagesBin = [...imagesLs]
    }
    const response = await fetch('https://api.jsonbin.io/b/6290ee9d449a1f3821f1ce1d/', {
        method: 'PUT',
        body: JSON.stringify({images: imagesBin}),
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        }
    });
    const data = await response.json();
    if(data.success === true){
        console.log('Dina bilder är nu synkade :)')   
    } else {
        console.log('Oh no syncing problems')
    }
};


/* VÄLJER VART VI SKA HÄMTA BILDERNA TILL GALLERIET */
// - hämta ev bilder från LS
// - OM (online)
//      - se om det finns ej synkade bilder från LS
//      - hämta hem BIN och lägg i visningsarray
//      - kalla på funktion createGallery(visningsarray)
// - ANNARS OM (det finns bilder i LS)
//      - lägg i visningsarray
//      - kalla på funktion createGallery(visningsarray)    
// - ANNARS
//      - printa "No pics" text i innerHTML
async function loadPhotos() {
    const imagesFromLs = JSON.parse(localStorage.getItem('weddingGallery'));
    if(navigator.onLine){
        updateGalleryBtn.style.display = "none"
        await syncBin();
        console.log('Du är online, dina bilder hämtas från JSON bin')
        imgArray = await getPhotosFromBin();
        createGallery(imgArray)
    } else if (imagesFromLs){
        console.log('Du är offline, dina bilder hämtas från LS')
        imgArray = [...imagesFromLs]
        createGallery(imgArray)
        updateGalleryBtn.style.display = "inline"
    } else {
        console.log('Du har inga bilder än')
        gallery.innerHTML = `<h3 class="no-pics-message">Du har inga bilder i galleriet ännu</h3>`
    } 
}


/* KLICK PÅ KAMERA/GALLERI KNAPPEN */
menuBtn.addEventListener('click',() => {
    if (!galleryOpen){
        takePhotoElem.style.display = "none";
        yourPhotoElem.style.display = "none";
        galleryElem.style.display = "flex";
        menuBtn.innerHTML = `<span class="iconify" data-icon="entypo:camera" style="color: white;" data-width="40"></span>`;
        galleryOpen = true;
        loadPhotos();
    } else {
        galleryElem.style.display = "none";
        yourPhotoElem.style.display = "none";
        takePhotoElem.style.display = "flex";
        menuBtn.innerHTML = `<span class="iconify" data-icon="bi:grid-fill" style="color: white;" data-width="40"></span>`;
        galleryOpen = false;
    }
});


/* SKAPAR NOTIS (text som skickas med vid resp ändamål) */
function createNotification(text) {
    const icon = 'icons/icon-192.png'
    if(noticePermission){
        new Notification('Notis', { body: text, icon: icon });
    }
};


/* FRÅGA OM PERMISSION ATT VISA NOTISER I WEBBLÄSAREN */
// - anropa notification.requestPermission
// - sen - permission som kommer tillbaka
// - OM (permission = granted/tillåter notiser)
//      - kalla på funktion som togglar permission boolean
function notificationPermission(){
    Notification.requestPermission()
        .then((permission) => { 
            if (permission === "granted"){
                noticeToggler(); 
            }
        })
};


/* TOGGLA MELLAN PÅ/AV NOTISER OCH IKON */
// - sätt notisPermission till det den inte är
// - OM (inte permission)
//      - byt ikonen till att det är avstängt
//      - OM (galleriet inte är öppet/står på kamerasidan)
//          - öppna ta kort sidan
//          - göm galleriet
// - ANNARS
//      - byt ikon till att notiser är på
//      - OM (galleriet inte är öppet/står på kamerasidan)
//          - öppna ta kort sidan
//          - göm galleriet
function noticeToggler () {
    noticePermission = !noticePermission
    if (!noticePermission){
        console.log('Notiser stängs av')
        noticeBtn.innerHTML = '<span class="iconify-inline" data-icon="carbon:notification-off" style="color: white;" data-width="30"></span>'
        if (!galleryOpen){
            openTakePhoto()
            galleryElem.style.display = "none"
        } 
    } else {
        console.log('Notiser sätts på')
        noticeBtn.innerHTML = '<span class="iconify-inline" data-icon="carbon:notification" style="color: white;" data-width="30"></span>'
        if (!galleryOpen){
            openTakePhoto()
            galleryElem.style.display = "none"
        } 
    }
}


/* KLICK PÅ NOTISKNAPPEN */
// - öppna notificationPermission
noticeBtn.addEventListener('click', () => notificationPermission());


/* STARTAR KAMERAN NÄR APPEN LADDAS */
window.addEventListener('load', async () => {
    if ('mediaDevices' in navigator) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
        video.srcObject = stream;
    }
});


/* SE OM PERMISSION FÖR NOTISER REDAN FINNS NÄR APPEN STARTAR */
window.addEventListener('load', () => {
    if (Notification.permission === "granted"){
        noticePermission = true;
        noticeBtn.innerHTML = '<span class="iconify-inline" data-icon="carbon:notification" style="color: white;" data-width="30"></span>'
    }
});


/* FÖRDRÖJNING FÖR ATT VISA INTROSIDAN */
// window.addEventListener('load', () => {
//     setTimeout(() => {
//         openTakePhoto()
//         }, 2000);
// })


/* REGISTRERA SERVICE WORKERS */
window.addEventListener('load', async () => {
  if('serviceWorker' in navigator){
      try {
          await navigator.serviceWorker.register('service-worker.js');
      } catch(err) {
          console.error('Oh no!', err)
      }
  }
});

//För bättre Prestanda kan man skippa Introt och instället starta appen direkt med...
openTakePhoto()
