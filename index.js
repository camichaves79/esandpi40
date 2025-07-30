const thresholdPercentage = 0.4; // 40% drop
let apiKey = "";
let dropAlertTriggered = false;
let peak = 0; // Initialize peak dynamically

console.log("Script loaded");

// Log API key updates
document.getElementById("submit-button").addEventListener("click", () => {
  const inputKey = document.getElementById("api-key").value;
  console.log("Submit button clicked. Input API key:", inputKey);
  if (inputKey) {
    apiKey = inputKey;
    console.log("API key updated to:", apiKey);
    alert("API key updated successfully!");
    fetchSP500(); // Trigger the first fetch with the new API key
    fetchPeak(); // Fetch the peak value with the new API key
  } else {
    console.log("No API key provided.");
    alert("Please enter a valid API key.");
  }
});

function isMarketOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Market is open Monday to Friday, 9:30 AM to 4:00 PM EST (14:30 to 21:00 UTC)
  const isWeekday = day >= 1 && day <= 5;
  const isWithinMarketHours = (hour > 14 || (hour === 14 && minute >= 30)) && hour < 21;

  return isWeekday && isWithinMarketHours;
}

async function fetchSP500() {
  if (!isMarketOpen()) {
    console.log("Market is closed. Skipping fetch.");
    document.getElementById("status").innerText = "Market is closed.";
    document.getElementById("status").style.color = "gray";
    return;
  }

  console.log("Fetching S&P 500 data with API key:", apiKey);
  if (!apiKey) {
    console.log("API key is missing. Cannot fetch data.");
    document.getElementById("status").innerText = "Please provide an API key.";
    document.getElementById("status").style.color = "gray";
    return;
  }

  const url = `https://api.polygon.io/v2/aggs/ticker/SPY/prev?apiKey=${apiKey}`;
  console.log("API request URL:", url);

  try {
    const res = await fetch(url);
    console.log("API response received:", res);
    const data = await res.json();
    console.log("Parsed API response data:", data);

    if (!data || data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error("Invalid or empty data received from API:", data);
      document.getElementById("status").innerText = "Invalid data received from API.";
      document.getElementById("status").style.color = "gray";
      return;
    }

    const currentPrice = data.results[0].c; // 'c' is the close price in Polygon.io's response
    console.log("Current S&P 500 price:", currentPrice);

    document.getElementById("current").innerText = currentPrice.toFixed(2);

    const threshold = peak * (1 - thresholdPercentage); // Calculate threshold based on the dynamic peak

    if (currentPrice < threshold) {
      console.log("Price dropped below threshold. Triggering alert.");
      document.getElementById("status").innerText = "🚨 Dropped 40%!";
      document.getElementById("status").style.color = "red";
      dropAlertTriggered = true;
    } else if (!dropAlertTriggered) {
      console.log("Price is above threshold. No alert triggered.");
      document.getElementById("status").innerText = "No drop yet.";
      document.getElementById("status").style.color = "green";
    }
  } catch (error) {
    console.error("Error fetching S&P 500 data:", error);
    document.getElementById("status").innerText = "Error fetching data.";
    document.getElementById("status").style.color = "gray";
  }
}

async function fetchPeak() {
  console.log("Fetching historical data to determine the most recent peak.");
  if (!isMarketOpen()) {
    console.log("Market is closed. Skipping historical data fetch.");
    document.getElementById("status").innerText = "Market is closed.";
    document.getElementById("status").style.color = "gray";
    return;
  }

  if (!apiKey) {
    console.log("API key is missing. Cannot fetch historical data.");
    document.getElementById("status").innerText = "Please provide an API key.";
    document.getElementById("status").style.color = "gray";
    return;
  }

  const url = `https://api.polygon.io/v2/aggs/ticker/SPY/range/1/day/2025-01-01/2025-07-29?apiKey=${apiKey}`;
  console.log("Historical data request URL:", url);

  try {
    const res = await fetch(url);
    console.log("Historical data response received:", res);
    const data = await res.json();
    console.log("Parsed historical data:", data);

    if (!data || (data.status !== "OK" && data.status !== "DELAYED") || !data.results || data.results.length === 0) {
      console.error("Invalid or empty historical data received:", data);
      document.getElementById("status").innerText = "Invalid historical data received.";
      document.getElementById("status").style.color = "gray";
      return;
    }

    // Ensure results array is processed correctly
    const highPrices = data.results.map(day => day.h).filter(price => typeof price === 'number' && price > 0);
    if (highPrices.length === 0) {
      console.error("No valid high prices found in historical data:", data.results);
      document.getElementById("status").innerText = "No valid high prices in historical data.";
      document.getElementById("status").style.color = "gray";
      return;
    }

    peak = Math.max(...highPrices); // Calculate the peak from valid high prices
    console.log("Most recent peak value determined:", peak);

    document.getElementById("peak").innerText = peak.toFixed(2);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    document.getElementById("status").innerText = "Error fetching historical data.";
    document.getElementById("status").style.color = "gray";
  }
}

// Fetch the initial peak value on load
fetchPeak();

console.log("Initial fetch triggered.");
fetchSP500();
setInterval(() => {
  console.log("Periodic fetch triggered.");
  fetchSP500();
}, 15 * 60 * 1000); // Refresh every 15 minutes during market hours