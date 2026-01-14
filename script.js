let wallCount = 1; // Start with one wall

function addWall() {
    const wallsContainer = document.getElementById('wallsContainer');
    const newWall = document.createElement('div');
    newWall.className = 'wall-section';
    newWall.innerHTML = `
        <h2>Wall ${wallCount + 1}</h2>
        <label for="height-${wallCount}">Height (feet):</label>
        <input type="number" id="height-${wallCount}" class="height" required min="0">

        <label for="width-${wallCount}">Width (feet):</label>
        <input type="number" id="width-${wallCount}" class="width" required min="0">

        <label for="depth-${wallCount}">Thickness (inches):</label>
        <input type="number" id="depth-${wallCount}" class="depth" required min="0" step="0.1">

        <label for="type-${wallCount}">Insulation Type:</label>
        <select id="type-${wallCount}" class="type">
            <option value="5">Fiberglass ($5/cu ft)</option>
            <option value="7">Foam ($7/cu ft)</option>
            <option value="10">Cellulose ($10/cu ft)</option>
        </select>
        <button type="button" class="remove-wall" onclick="removeWall(this)">Remove Wall</button>
    `;
    wallsContainer.appendChild(newWall);
    wallCount++;
}

function removeWall(button) {
    const wallSection = button.parentElement;
    wallSection.remove();
    // Update wall numbers
    const wallSections = document.querySelectorAll('.wall-section');
    wallSections.forEach((section, index) => {
        section.querySelector('h2').textContent = `Wall ${index + 1}`;
    });
    wallCount--;
}

document.getElementById('addWall').addEventListener('click', addWall);

function calculateCost() {
    const heights = document.querySelectorAll('.height');
    const widths = document.querySelectorAll('.width');
    const depths = document.querySelectorAll('.depth');
    const types = document.querySelectorAll('.type');

    let totalVolume = 0;
    let totalCost = 0;
    let valid = true;

    for (let i = 0; i < heights.length; i++) {
        const height = parseFloat(heights[i].value);
        const width = parseFloat(widths[i].value);
        const depth = parseFloat(depths[i].value);
        const pricePerCuFt = parseFloat(types[i].value);

        if (isNaN(height) || isNaN(width) || isNaN(depth) || height <= 0 || width <= 0 || depth <= 0) {
            valid = false;
            break;
        }

        const depthInFeet = depth / 12;
        const volume = height * width * depthInFeet;
        const cost = volume * pricePerCuFt;

        totalVolume += volume;
        totalCost += cost;
    }

    const resultDiv = document.getElementById('insulationResult');
    if (!valid) {
        resultDiv.innerHTML = 'Please enter valid positive numbers for all walls.';
    } else {
        resultDiv.innerHTML = 
            `Total Volume: ${totalVolume.toFixed(2)} cubic feet<br>Total Estimated Cost: $${totalCost.toFixed(2)}`;
    }
}

// -------------------
// Travel Cost Feature
// -------------------

let mapsLoaded = false;

function initGoogleMaps() {
    // Called when Google Maps API finishes loading
    mapsLoaded = true;
    console.log("Google Maps API loaded");
}

// Global reference to DistanceMatrixService (initialized after load)
let distanceService;

// Wait for Google API to load before using it
function calculateTravelCost() {
    const destination = document.getElementById('destination').value.trim();
    const resultDiv = document.getElementById('travelResult');

    if (!destination) {
        resultDiv.innerHTML = 'Please enter a destination address.';
        return;
    }

    if (!mapsLoaded) {
        resultDiv.innerHTML = 'Google Maps is still loading... try again in a few seconds.';
        return;
    }

    if (!distanceService) {
        distanceService = new google.maps.DistanceMatrixService();
    }

    const HOME = '1600 Pennsylvania Ave NW, Washington, DC 20500';
    const IRS_RATE = 0.725; // dollars per mile (72.5 cents, 2026 rate)

    distanceService.getDistanceMatrix(
        {
            origins: [HOME],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL, // miles
        },
        (response, status) => {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                resultDiv.innerHTML = `Error: ${status}. Check address or API key.`;
                console.error('Distance Matrix error:', status, response);
                return;
            }

            const element = response.rows[0].elements[0];
            if (element.status !== google.maps.DistanceMatrixElementStatus.OK) {
                resultDiv.innerHTML = `Cannot find route: ${element.status}`;
                return;
            }

            // Distance comes as text like "1,234 mi" – parse the number
            const distanceText = element.distance.text;
            const distanceMiles = parseFloat(distanceText.replace(/[^0-9.]/g, ''));

            const roundTripMiles = distanceMiles * 2;
            const cost = roundTripMiles * IRS_RATE;

            resultDiv.innerHTML = `
                <strong>Destination:</strong> ${destination}<br>
                <strong>One-way Distance:</strong> ${distanceMiles.toFixed(1)} miles<br>
                <strong>Round-trip Distance:</strong> ${roundTripMiles.toFixed(1)} miles<br>
                <strong>Estimated Reimbursement:</strong> $${cost.toFixed(2)} (at $${IRS_RATE}/mile IRS 2026 rate)
            `;
        }
    );
}