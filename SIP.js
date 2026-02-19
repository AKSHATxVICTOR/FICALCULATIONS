let donutChart;

window.calculateFISIP = function () {
  const currentAge = Number(document.getElementById("currentAge").value);
  let sipAmount = Number(document.getElementById("sipAmount").value);
  const returnRate =
    Number(document.getElementById("returnRate").value) / 100;
  const targetCorpus = Number(
    document.getElementById("targetCorpus").value
  );

  // OPTIONAL step-up
  const stepUpPercent =
    Number(document.getElementById("stepUp")?.value) / 100 || 0;

  if (!currentAge || !sipAmount || !returnRate || !targetCorpus) {
    document.getElementById("output").innerText =
      "Please enter all required values correctly.";
    return;
  }

  let age = currentAge;
  let corpus = 0;
  let invested = 0;
  let yearlySIP = sipAmount * 12;

  while (corpus < targetCorpus && age < 60) {
    invested += yearlySIP;
    corpus = (corpus + yearlySIP) * (1 + returnRate);

    // Apply step-up at end of each year (if provided)
    if (stepUpPercent > 0) {
      yearlySIP = yearlySIP * (1 + stepUpPercent);
    }

    age++;
  }

  const roundedInvested = Math.round(invested);
  const roundedReturns = Math.round(corpus - invested);

  document.getElementById("output").innerText =
    corpus >= targetCorpus
      ? `You can achieve Financial Independence at age ${age}`
      : "Target corpus not achievable with current inputs.";

  drawDonutChart(roundedInvested, roundedReturns);
};


function drawDonutChart(invested, returns) {
  const ctx = document.getElementById("donutChart");

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Invested Amount", "Estimated Returns"],
      datasets: [{
        data: [invested, returns],
        backgroundColor: ["#182219", "#2ee89a"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { position: "top", labels: { color: "#e4ede8", font: { family: "DM Sans" } } }
      }
    }
  });
}