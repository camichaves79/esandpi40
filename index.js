const peak = 5650;
    const threshold = peak * 0.6; // 40% drop
    const apiKey = "YOUR_API_KEY_HERE";
    const url = `https://financialmodelingprep.com/api/v3/quote/%5EGSPC?apikey=${apiKey}`;

    let dropAlertTriggered = false;

    async function fetchSP500() {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const currentPrice = data[0].price;

        document.getElementById("current").innerText = currentPrice.toFixed(2);

        if (currentPrice < threshold) {
          document.getElementById("status").innerText = "🚨 Dropped 40%!";
          document.getElementById("status").style.color = "red";
          dropAlertTriggered = true;
        } else if (!dropAlertTriggered) {
          document.getElementById("status").innerText = "No drop yet.";
          document.getElementById("status").style.color = "green";
        }
      } catch (error) {
        console.error("Error fetching S&P 500 data:", error);
        document.getElementById("status").innerText = "Error fetching data.";
        document.getElementById("status").style.color = "gray";
      }
    }

    fetchSP500();
    setInterval(fetchSP500, 60 * 1000); // Refresh every minute