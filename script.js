'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Gloab Variable for Map
let map, mapEvent;

if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
    const {latitude, longitude} = pos.coords;
    const zoomLevel = 16;
    map = L.map('map').setView([latitude, longitude], zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);


    // Customize red icon maker for current location
    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41], // Default size
        iconAnchor: [12, 41], // Point of the icon corresponding to marker's location
        popupAnchor: [1, -34] // Point where the popup opens relative to the iconAnchor
    });

    // Current location Maker
    // L.marker([latitude, longitude], {icon: redIcon}).addTo(map)
    //     .bindPopup('A pretty CSS popup.<br> Easily customizable.')
    //     .openPopup();

    // Add exercise maker on map
    map.on('click', function (mapE) {
        mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    })

}, function() {
    alert("Can't fetch the location!");
})

form.addEventListener('submit',(e)=>{
    // Prevent Default Behaviour
    e.preventDefault();

    // Clear Input Field
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

    // Adding marker to map
    const {lat,lng} = mapEvent.latlng
    L.marker([lat,lng])
        .addTo(map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose:false,
                closeOnClick: false,
                className: 'running-popup',
            })
            )
        .setPopupContent("Workout!")
        .openPopup();
})

inputType.addEventListener('change', (e)=>{
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
})
