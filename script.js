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

class Workout {
    date = new Date();
    id = (Date.now()+"").slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
}

class Running extends Workout {
    type = "running";

    constructor(coords,distance,duration,cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.peace = this.calcPace();
    }

    calcPace() {
        return this.duration/this.distance;
    }
}

class Cycling extends Workout {
    type = "cycling";

    constructor(coords,distance,duration,elevaionGain) {
        super(coords,distance,duration);
        this.elevaionGain = elevaionGain;
        this.speed = this.calcSpeed();
    }

    calcSpeed() {
        return this.distance/(this.duration/60);
    }
}

class App {
    #map;
    #mapEvent;
    workouts = [];

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

        //Get data from form
        const {lat,lng} = this.#mapEvent.latlng
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        let workout;
        //Check data is valid (Number, Positive)
        const validateInput = (...inputs)=>inputs.every(el => Number.isFinite(el));
        const isPositive = (...inputs)=>inputs.every(el=>el>0);

        //Create workout based on type
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!validateInput(distance,duration,cadence) || !isPositive(distance,duration,cadence))
                return alert("Please enter the valid number input and positive number!");
            workout = new Running([lat,lng],distance,duration,cadence)
        }
        else if (type === 'cycling') {
            const elevation = +inputElevation.value;
             if (!validateInput(distance,duration,elevation) || !isPositive(distance,duration))
                return alert("Please enter the valid number input and positive number!");
            workout = new Cycling([lat,lng],distance,duration,elevation)
        }

        //Push to workouts array
        this.workouts.push(workout);
        //Render workout on map
        this.renderWorkoutMaker(workout);

        // Clear Input Field
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";
        form.classList.toggle("hidden");
    }

    renderWorkoutMaker(workout) {
        // Adding marker to map
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose:false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
                )
            .setPopupContent("Workout!")
            .openPopup();
    }
}

const mapty = new App();
