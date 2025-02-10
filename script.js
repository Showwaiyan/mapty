'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const formAction = document.querySelector('.form__action');
const deleteAllBtn = document.querySelector('.btn--delete-all');
const sortBtn = document.querySelector('.btn--sort');
const ascendingBtn = document.querySelector(".btn--ascending-data");
const descendingBtn = document.querySelector(".btn--descending-data");

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

    constructor(coords,distance,duration,elevation) {
        super(coords,distance,duration);
        this.elevation = elevation;
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

    #editMode = false;
    #currentEditWorkout = null;
    #currentEditWorkoutEl = null;

    #markers = [];

    #sortingStyle = null;
    #ascendingOrder = (a,b) => a[this.#sortingStyle]-b[this.#sortingStyle];
    #desendingOrder = (a,b) => b[this.#sortingStyle]-a[this.#sortingStyle];

    constructor() {
        this._getPosition();

        form.addEventListener('submit', this._newWorkout.bind(this));
        form.addEventListener('submit',this._updateWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopUp.bind(this));
        containerWorkouts.addEventListener('click',this._editWorkout.bind(this));
        containerWorkouts.addEventListener('click',this._deleteWorkout.bind(this));
        deleteAllBtn.addEventListener('click',this.reset);
        sortBtn.addEventListener('change',this._changeSortingStyle.bind(this));
        ascendingBtn.addEventListener('click',this._sortInStyle.bind(this,this.#ascendingOrder));
        descendingBtn.addEventListener('click',this._sortInStyle.bind(this,this.#desendingOrder));
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

        // Getting data from local storage
        this._getLocalStorage();
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        if (this.#editMode) {
            inputType.setAttribute("disabled",true);
        } else inputType.removeAttribute("disabled");
        inputDistance.focus();
    }

    _hideForm() {
        // Clear Input Field
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        //Hide form
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(() => {
           form.style.display = "grid" ;
        }, 1000);
    }

    //Check data is valid (Number, Positive)
    _isNumber(...inputs) {
        return inputs.every(el => Number.isFinite(el));
    }
    _isPositive (...inputs) {
        return inputs.every(el=>el>0);
    }

    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {
        // Prevent Default Behaviour
        e.preventDefault();
        if (this.#editMode) return;

        //Get data from form
        const {lat,lng} = this.#mapEvent.latlng
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        let workout;


        //Create workout based on type
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!this._isNumber(distance,duration,cadence) || !this._isPositive(distance,duration,cadence))
                return alert("Please enter the valid number input and positive number!");
            workout = new Running([lat,lng],distance,duration,cadence)
        }
        else if (type === 'cycling') {
            const elevation = +inputElevation.value;
             if (!this._isNumber(distance,duration,elevation) || !this._isPositive(distance,duration))
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
        this._hideForm();

        // Save to local storage
        this._setLocalStorage();
    }

    _renderWorkoutMaker(workout) {
        // Adding marker to map
        const marker = L.marker(workout.coords)
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
        this.#markers.push(marker);
    }

    _renderWorkoutInHTML(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <div class="workout__nav">
                    <h2 class="workout__title">${workout.description}</h2>
                    <div>
                        <button class="btn btn--edit">✏️</button>
                        <button class="btn btn--delete">🗑️</button>
                    </div>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂' : '🚴‍♀️'}</span>
                    <span class="workout__value workout__value--distance">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value workout__value--duration">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `
        if (workout.type === 'running')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value workout__value--pace">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value workout__value--cadence">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
        `;
        else if (workout.type === 'cycling')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value workout__value--speed">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value workout__value--elevation">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
        `;

        form.insertAdjacentHTML("afterend",html);

        //Activate delete all function when workouts are more than 4
        if (this.#workouts.length > 4) {
            formAction.style.display = "flex";
        }
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

    _setLocalStorage() {
        localStorage.setItem("workouts",JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(workout=>{
            // Set Prototype Chain
            if (workout.type === 'running') Object.setPrototypeOf(workout, Running.prototype);
            else Object.setPrototypeOf(workout, Cycling.prototype);
            workout.date = new Date(workout.date);

            this._renderWorkoutInHTML(workout);
            this._renderWorkoutMaker(workout);
        })
    }

    _editWorkout(e) {
        if (!e.target.classList.contains("btn--edit")) return;
        this.#editMode = true;
        this._showForm();

        this.#currentEditWorkoutEl = e.target.closest(".workout");
        this.#currentEditWorkout = this.#workouts.find(workout=>workout.id===this.#currentEditWorkoutEl.dataset.id);

        inputType.value = this.#currentEditWorkout.type;
        inputDistance.value = this.#currentEditWorkout.distance;
        inputDuration.value = this.#currentEditWorkout.duration;
        if (this.#currentEditWorkout.type === "running") {
            inputElevation.closest(".form__row").classList.add("form__row--hidden");
            inputCadence.closest(".form__row").classList.remove("form__row--hidden");
            inputCadence.value = this.#currentEditWorkout.cadence;
        }
        else if (this.#currentEditWorkout.type === "cycling") {
            inputElevation.closest(".form__row").classList.remove("form__row--hidden");
            inputCadence.closest(".form__row").classList.add("form__row--hidden");
            inputElevation.value = this.#currentEditWorkout.elevation;
        }
    }

    _updateWorkout() {
        if (!this.#editMode) return;

        if (!this._isNumber(+inputDistance.value,+inputDuration.value)) return alert("Please enter the valid number input and positive number!");
        // change workout value from input
        this.#currentEditWorkout.distance = +inputDistance.value;
        this.#currentEditWorkout.duration = +inputDuration.value;
        // running workout
        if (this.#currentEditWorkout.type === 'running') {
            if (!this._isPositive(+inputCadence.value)) return alert("Please enter the valid number input and positive number!");
            this.#currentEditWorkout.cadence = +inputCadence.value;
            this.#currentEditWorkout.pace = this.#currentEditWorkout.calcPace();
        }
        else if (this.#currentEditWorkout.type === 'cycling') {
            if (!this._isPositive(+inputElevation.value)) return alert("Please enter the valid number input and positive number!");
            this.#currentEditWorkout.elevation = +inputElevation.value;
            this.#currentEditWorkout.speed = this.#currentEditWorkout.calcSpeed();
        }

        this._hideForm();
        // Updating workout html
        this.#currentEditWorkout._setDescription();
        this.#currentEditWorkoutEl.querySelector('.workout__title').innerText = this.#currentEditWorkout.description;
        this.#currentEditWorkoutEl.querySelector('.workout__icon').innerText = this.#currentEditWorkout.type === 'running' ? '🏃‍♂' : '🚴‍♀️';
        this.#currentEditWorkoutEl.querySelector('.workout__value--distance').innerText = this.#currentEditWorkout.distance;
        this.#currentEditWorkoutEl.querySelector('.workout__value--duration').innerText = this.#currentEditWorkout.duration;

        if (this.#currentEditWorkout.type === 'running') {
            this.#currentEditWorkoutEl.querySelector('.workout__value--pace').innerText = this.#currentEditWorkout.pace.toFixed(1);
            this.#currentEditWorkoutEl.querySelector('.workout__value--cadence').innerText = this.#currentEditWorkout.cadence;
        } else {
            this.#currentEditWorkoutEl.querySelector('.workout__value--speed').innerText = this.#currentEditWorkout.speed.toFixed(1);
            this.#currentEditWorkoutEl.querySelector('.workout__value--elevation').innerText = this.#currentEditWorkout.elevation;
        }

        this.#currentEditWorkout = this.#currentEditWorkoutEl = null;
        this._setLocalStorage();

        setTimeout(() => {
            this.#editMode = false;
        }, 1000);
    }

    _deleteWorkout(e) {
        if (!e.target.classList.contains('btn--delete')) return;

        const workoutEl = e.target.closest('.workout');

        // Finding index for removeing element
        const workoutIndex = this.#workouts.findIndex((el)=>el.id === workoutEl.dataset.id);

        // remove from map
        this.#markers[workoutIndex].remove();
        this.#markers.splice(workoutIndex,1);

        // remove from array
        this.#workouts.splice(workoutIndex,1);

        // remove from dom
        workoutEl.remove();

        this._setLocalStorage();

    }

    _changeSortingStyle(e) {
        this.#sortingStyle = sortBtn.value;
    }

    _sortInStyle(type) {
        if (!this.#sortingStyle) return;
        const sortedWorkouts = this.#workouts.toSorted(type);

        // Remove orginal HTML El
        document.querySelectorAll(".workout").forEach(el=>el.remove());

        // Add new workout
        sortedWorkouts.forEach(workout=>this._renderWorkoutInHTML(workout));
    }

    reset() {
        localStorage.removeItem("workouts");
        location.reload();
    }
}

const mapty = new App();
