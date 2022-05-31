const API_KEY = '$2b$10$yW3fxf3SBSr.INGd5k9.qOK.2PnvlpAj2aWBcvRfui9vcAurz2HN6'
//const API_KEY = process.env.API_KEY;


const introPage = document.querySelector("#intro-page-section");
const headerElem = document.querySelector("#header-wrapper");

const takePhotoElem = document.querySelector("#take-photo-section");
const video = document.querySelector("#camera");
const takePhotoBtn = document.querySelector("#take-photo-btn");

const yourPhotoElem = document.querySelector("#your-photo-section");
const canvas = document.querySelector("#picture");
const newPhotoBtn = document.querySelector("#new-photo-btn");

const galleryElem = document.querySelector("#gallery-section")
const gallery = document.querySelector("#gallery");
const removeBtn = document.querySelector("#remove-btn")

const menuBtn = document.querySelector("#menu-btn");
let galleryOpen = false;

const ctx = canvas.getContext('2d');
let stream;

let imgArray = [];

//behövs denna ens????????
//variabel som ska hålla "svaret" användaren ger angående tillåtelse att skicka notiser
// let notificationPermission = '';


/* VIEW - VISA TAGEN BILD */
function openYourPhoto() {
    takePhotoElem.style.display = "none";
    yourPhotoElem.style.display = "flex";
}
/* VIEW - TA NY BILD */
function openTakePhoto() {
    takePhotoElem.style.display = "flex";
    headerElem.style.display = "flex";
    yourPhotoElem.style.display = "none";
    introPage.style.display = "none";
}

/* TILLBAKA TILL KAMERAN */
// - onclick för att öppna funktionen för att ta en ny bild
newPhotoBtn.addEventListener('click', () => openTakePhoto());



//OBS!!!! 
//Lägg in en else för offline
// KLAR??

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
// - kalla på notis
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
// - mappa ut alla bilder i arrayen inkl onclick för att ta bort
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
async function syncBin() {
    console.log('Dina bilder synkas...')
    gallery.innerHTML = '<span class="spinner"><i class="fa fa-spinner fa-spin"></i></span>'
    let imagesBin = await getPhotosFromBin()
    const imagesLs = JSON.parse(localStorage.getItem('weddingGallery'));
    if (imagesLs){
        imagesBin = [...imagesLs]
    }
    const response = await fetch('https://api.jsonbin.io/b/6290ee9d449a1f3821f1ce1d', {
        method: 'PUT',
        body: JSON.stringify({images: imagesBin}),
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        }
    });

    const data = await response.json();
    console.log('Dina bilder är nu synkade!', data)    
}


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
        await syncBin();
        console.log('Du är online, dina bilder hämtas från JSON bin')
        imgArray = await getPhotosFromBin();
        createGallery(imgArray)
    } else if (imagesFromLs){
        console.log('Du är offline, dina bilder hämtas från LS')
        imgArray = [...imagesFromLs]
        createGallery(imgArray)
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
    const notification = new Notification('Notis', { body: text, icon: icon });
};


/* STARTAR KAMERAN NÄR APPEN LADDAS */
window.addEventListener('load', async () => {
    if ('mediaDevices' in navigator) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
        video.srcObject = stream;
    }

    Notification.requestPermission()
});


//Registrera SW
window.addEventListener('load', async () => {
  if('serviceWorker' in navigator){
      try {
          await navigator.serviceWorker.register('service-worker.js');
      } catch(err) {
          console.error('Oh no!', err)
      }
  }
});


//FÖRDRÖJNING FÖR ATT VISA INTROSIDAN
window.addEventListener('load', () => {
    setTimeout(() => {
        openTakePhoto()
        }, 2000);
})




















/* SKAPAR BILDERNA I GALLERIET */
// function createPhoto(image) {
//     const photoElem = document.createElement('img');
//     photoElem.setAttribute('src', image.image)
//     photoElem.setAttribute('class', 'taken-img')
//     gallery.append(photoElem);
// }

    // //pushar in i vår globala images 
    // images.push({ id: images.length, image: imageData });
    // //lagrar global images i LS
    // localStorage.setItem('weddingGallery', JSON.stringify(images));



    // function removeImage(inImage){
    //     // console.log(id)
    //     // console.log(typeof id)
    //     console.log('Remove klickad')
    //     //hämta in id som skickas med. gör om inkommande sträng id till en int så det går att jämföra med
    //     // inId = parseInt(id)
    //     //hämta arrayen som ska jämföras med
    //     let newImagesArray = JSON.parse(localStorage.getItem('weddingGallery'));
    //     //filtrera ut alla (och lägg i ny array) som inte matchar inskickat id
    //     newImagesArray = newImagesArray.filter((image) => {
    //         // if (image.id !== inId) {
    //         //     return image;
    //         // }
    //         console.log(typeof image.image)
    //               if (image.image !== inImage) {
    //              return image;
    //          }
    //     })
    //     //spara ny array i LS
    //     localStorage.setItem('weddingGallery', JSON.stringify(newImagesArray));
    //     //meddela att bilden är borttagen
    //     console.log('Din bild är nu borttagen')
    //     //laddar bilder igen
    //     loadPhotos();
    
    //     //synka med bin
    
    // }



//SAVE PHOTO

        //PROBLEM! 
    //kan inte läsa längden när den är tom. object?
    //******
    // //läs in LS
    // const imagesFromLs = JSON.parse(localStorage.getItem('weddingGallery'));
    // console.log(typeof imagesFromLs)
    // //pusha in ny bild
    // imagesFromLs.push({ id: imagesFromLs.length, image: newPhoto });
    // //uppdatera LS
    // localStorage.setItem('weddingGallery', JSON.stringify(imagesFromLs));

    //PROBLEM! 
    //alla gamla bilder kommer tillbaka när en ny bild tas
    //******
    //pushar in i vår globala imagesArray 
    // imagesArray.push({ id: imagesArray.length, image: newPhoto });
    // //lagrar global imagesArray i LS
    // localStorage.setItem('weddingGallery', JSON.stringify(imagesArray));
    //createNotification ('Ditt foto är sparat')
    //synka med bin
    //syncBin()


    /*
async function loadPhotos() {
    imagesFromLs = JSON.parse(localStorage.getItem('weddingGallery'));

    if (navigator.onLine){
        console.log('loadPhotos: Du är online, dina bilder hämtas från JSON bin')
        const imagesFromBin = await getPhotosFromBin();
        //skicka in BIN bilderna i createGallery
        createGallery(imagesFromBin);
    } else if (imagesFromLs){
        console.log('loadPhotos: Du är offline, dina bilder hämtas från LS')
        //skicka in LS bilderna i createGallery
        createGallery(imagesFromLs);
    } else {
        console.log('loadPhotos: Du har inga bilder än')
        gallery.innerHTML = `<h3 class="no-pics-message">Du har inga bilder i galleriet ännu</h3>`
    } 
}
*/


// /* SKAPAR NOTIS (text som skickas med vid resp ändamål) */
// function createNotification(text) {
//     //Behövs denna ens???
//     // if (notificationPermission === 'granted') {
//     //     const icon = 'icons/icon-192.png'
//     //     const notification = new Notification('Notis', { body: text });
//     // }

//     const icon = 'icons/icon-192.png'
//     const notification = new Notification('Notis', { body: text, icon: icon });
    

//     // //om vi vill att det ska hända något när vi trycker på notisen
//     // notification.addEventListener('click', () => {
//     //     //här öppnar vi ett nytt fönster av vår sida
//     //     window.open('https://localhost:443');
//     // });
// };


// /* STARTAR KAMERAN NÄR APPEN LADDAS */
// window.addEventListener('load', async () => {
//     if ('mediaDevices' in navigator) {
//         stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
//         video.srcObject = stream;
//     }

//     Notification.requestPermission()
//         //behövs detta ens????
//         // .then((permission) => {
//         //     //testlogg
//         //     console.log(permission)
//         //     //sätter vår tidigare deklarerar variabel till utfallet
//         //     notificationPermission = permission;
//         // });
// });

//remove

    // //hämta arrayen som ska jämföras med
    // let newImagesArray = JSON.parse(localStorage.getItem('weddingGallery'));
    // //filtrera ut alla (och lägg i ny array) som inte matchar inskickat id
    // newImagesArray = newImagesArray.filter((image) => {
    //     if (image.image !== inImage) {
    //         return image;
    //     }
    // })
    // //spara ny array i LS
    // localStorage.setItem('weddingGallery', JSON.stringify(newImagesArray));
    // //meddela att bilden är borttagen
    // createNotification ('Ditt foto är raderat')
    // //laddar bilder igen
    // loadPhotos();

    // //synka med bin
    // syncBin();