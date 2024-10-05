async function fetchClimateDataFromNASA(latitude, longitude, startDate, endDate) {
    const response = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDate}&end=${endDate}&format=JSON`);
    const data = await response.json();
    return data.properties.parameter.T2M;
}

async function fetchData() {
    const cropType = document.getElementById('cropType').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const startDate = document.getElementById('startDate').value.replace(/-/g, '');
    const endDate = document.getElementById('endDate').value.replace(/-/g, '');

    const climateData = await fetchClimateDataFromNASA(latitude, longitude, startDate, endDate);

    // Analisar dados climáticos para determinar a melhor data de colheita
    const bestHarvestDate = analyzeData(climateData);

    // Armazenar informações no histórico
    storeData({ cropType, latitude, longitude, startDate, endDate, bestHarvestDate });

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
