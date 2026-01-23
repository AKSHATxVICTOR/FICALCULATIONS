let donutChart;

window.calculateFI = function () {
  const age = Number(document.getElementById("currentAge").value);
  const sip = Number(document.getElementById("sipAmount").value);
  const rate = Number(document.getElementById("returnRate").value) / 100;
  const target = Number(document.getElementById("targetCorpus").value);

  if (!age || !sip || !rate || !target) {
    document.getElementById("output").innerText =
      "Please fill all fields correctly.";
    return;
  }

  let corpus = 0;
  let years = 0;

  while (corpus < target && years < 60) {
    corpus = (corpus + sip * 12) * (1 + rate);
    years++;
  }
  const invested = sip * 12 * years;
  const returns = corpus - invested;
    drawDonutChart(invested, returns);

  const fiAge = age + years;

  if (corpus >= target) {
    document.getElementById("output").innerText =
      `You can achieve Financial Independence at approximately age ${fiAge}.`;
  } else {
    document.getElementById("output").innerText =
      "Target not achievable with current inputs.";
  }
}

function drawDonutChart(invested, returns) {
  const ctx = document.getElementById("donutChart");

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Invested Amount", "Estimated Returns"],
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
