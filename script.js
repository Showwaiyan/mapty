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

class App {
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            function() {
            alert("Can't fetch the location!");
            })
    }

    _loadMap(position) {
        const {latitude, longitude} = position.coords;
        const zoomLevel = 16;
        this.#map = L.map('map').setView([latitude, longitude], zoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
        }).addTo(this.#map);

        // Add exercise maker on map
        this.#map.on('click', this._showForm.bind(this))
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }

    _toggleElevationField(e) {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {
        // Prevent Default Behaviour
        e.preventDefault();

        // Clear Input Field
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        // Adding marker to map
        const {lat,lng} = this.#mapEvent.latlng
        L.marker([lat,lng])
            .addTo(this.#map)
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
    }
}

const mapty = new App();
