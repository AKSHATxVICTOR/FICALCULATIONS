let donutChart;

window.calculatePortfolioFI = function () {
  const currentAge = Number(document.getElementById("currentAge").value);
  let sip = Number(document.getElementById("sipAmount").value);
  const stepUp = Number(document.getElementById("stepUp").value) / 100 || 0;
  const lumpsum = Number(document.getElementById("lumpsumAmount").value);
  const rate = Number(document.getElementById("returnRate").value) / 100;
  const target = Number(document.getElementById("targetCorpus").value);

  if (!currentAge || !rate || !target) {
    document.getElementById("output").innerText =
      "Please enter all required values.";
    return;
  }

  let age = currentAge;
  let totalCorpus = lumpsum;
  let totalInvested = lumpsum;
  let yearlySIP = sip * 12;

  while (totalCorpus < target && age < 100) {
    // SIP contribution
    totalCorpus += yearlySIP;
    totalInvested += yearlySIP;

    // Growth on total portfolio
    totalCorpus *= (1 + rate);

    // SIP step-up
    if (stepUp > 0) {
      yearlySIP *= (1 + stepUp);
    }

    age++;
  }

  if (totalCorpus >= target) {
    document.getElementById("output").innerText =
      `You can achieve Financial Independence at age ${age}`;
  } else {
    document.getElementById("output").innerText =
      "Target corpus not achievable with current inputs.";
  }

  drawDonutChart(
    Math.round(totalInvested),
    Math.round(totalCorpus - totalInvested)
  );
};

function drawDonutChart(invested, returns) {
  const ctx = document.getElementById("donutChart");

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Total Invested", "Total Returns"],
      datasets: [{
        data: [invested, returns],
        backgroundColor: ["#e6ebff", "#11e13a"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: { position: "top" }
      }
    }
  });
}
