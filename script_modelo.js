let autocomplete;

function initMap() {
    const input = document.getElementById('location');
    autocomplete = new google.maps.places.Autocomplete(input);

    // Listener para quando um lugar é selecionado
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            alert('Por favor, selecione um lugar válido.');
            return;
        }
        // Pegue a latitude e longitude do local selecionado
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    });
}

async function fetchClimateDataFromNASA(latitude, longitude, startDate, endDate) {
    try {
        const response = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDate}&end=${endDate}&format=JSON`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados climáticos da NASA');
        }
        const data = await response.json();
        console.log(data);
        return data.properties.parameter.T2M;
    } catch (error) {
        console.error('Erro ao buscar dados climáticos:', error);
        alert('Erro ao buscar dados climáticos. Por favor, tente novamente mais tarde.');
        return null;
    }
}

async function fetchData() {
    const cropType = sanitizeInput(document.getElementById('plantio').value);
    const location = sanitizeInput(document.getElementById('location').value);
    const startDate = sanitizeInput(document.getElementById('startDate').value.replace(/-/g, ''));
    const endDate = sanitizeInput(document.getElementById('endDate').value.replace(/-/g, ''));

    if (!cropType || !location || !startDate || !endDate) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const place = autocomplete.getPlace();
    if (!place || !place.geometry) {
        alert("Por favor, selecione uma localização válida.");
        return;
    }
    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();

    const climateData = await fetchClimateDataFromNASA(latitude, longitude, startDate, endDate);
    if (!climateData) {
        return;
    }

    // Analisar dados climáticos para determinar a melhor data de colheita
    const bestHarvestDate = analyzeData(climateData);

    // Armazenar informações no histórico
    storeData({ cropType, location, startDate, endDate, bestHarvestDate });

    document.getElementById('output').innerText = `Melhor data de colheita: ${bestHarvestDate.date}\nMotivo: ${bestHarvestDate.reason}`;
}

function analyzeData(data) {
    let bestDate = null;
    let bestScore = -Infinity;
    let reason = '';

    for (const [date, temperature] of Object.entries(data)) {
        const score = calculateHarvestScore(temperature);
        if (score > bestScore) {
            bestScore = score;
            bestDate = date;
            reason = `Temperatura média de ${temperature}°C, ideal para a colheita.`;
        }
    }

    return { date: bestDate, reason: reason };
}

function calculateHarvestScore(temperature) {
    const idealTemperature = 25; // Exemplo de temperatura ideal
    const temperatureDifference = Math.abs(temperature - idealTemperature);
    return -temperatureDifference; // Quanto menor a diferença, melhor a pontuação
}

function storeData(data) {
    let history = JSON.parse(localStorage.getItem('history')) || [];
    history.push(data);
    localStorage.setItem('history', JSON.stringify(history));
}

function sanitizeInput(input) {
    const element = document.createElement('div');
    element.innerText = input;
    return element.innerHTML;
}

window.onload = initMap;
