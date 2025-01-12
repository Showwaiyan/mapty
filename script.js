'use strict';

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

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = "running";

    constructor(coords,distance,duration,cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.pace = this.calcPace();

        this._setDescription();
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

        this._setDescription();
    }

    calcSpeed() {
        return this.distance/(this.duration/60);
    }
}

class App {
    #map;
    #mapEvent;
    #zoomLevel = 13;
    #workouts = [];

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopUp.bind(this));
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
        this.#map = L.map('map').setView([latitude, longitude], this.#zoomLevel);

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

    _HideForm() {
        // Clear Input Field
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        //Hide form
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => {
           form.style.display = "grid" ;
        }, 1000);
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
        this.#workouts.push(workout);

        //Render workout on list
        this._renderWorkoutInHTML(workout);

        //Render workout on map
        this._renderWorkoutMaker(workout);

        // Hide From
        this._HideForm();
    }

    _renderWorkoutMaker(workout) {
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

    _renderWorkoutInHTML(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `
        if (workout.type === 'running')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
        `;
        else if (workout.type === 'cycling')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevaionGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
        `;

        form.insertAdjacentHTML("afterend",html);
    }

    _moveToPopUp(e) {
        const workoutEl = e.target.closest(".workout");

        if (!workoutEl) return; // if workoutEl does not exist return

        const workout = this.#workouts.find(workout => workout.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords, this.#zoomLevel, {
            animate: true,
            pan: {
                animate: true,
                duration: 1,
            }
        })
    }
}

const mapty = new App();
