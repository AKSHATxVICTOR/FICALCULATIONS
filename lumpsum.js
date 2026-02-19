let donutChart;

window.calculateLumpsumFI = function () {
  const currentAge = Number(document.getElementById("currentAge").value);
  const lumpsum = Number(document.getElementById("lumpsumAmount").value);
  const returnRate = Number(document.getElementById("returnRate").value) / 100;
  const targetCorpus = Number(document.getElementById("targetCorpus").value);

  if (!currentAge || !lumpsum || !returnRate || !targetCorpus) {
    document.getElementById("output").innerText =
      "Please fill all fields correctly.";
    return;
  }

  let age = currentAge;
  let corpus = lumpsum;

  while (corpus < targetCorpus && age < 60) {
    corpus = corpus * (1 + returnRate);
    age++;
  }

  document.getElementById("output").innerText =
    corpus >= targetCorpus
      ? `You can achieve Financial Independence at age ${age}`
      : "Target corpus not achievable with current inputs.";

  drawDonutChart(lumpsum, corpus - lumpsum);
};

function drawDonutChart(invested, returns) {
  const ctx = document.getElementById("donutChart");

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Invested Amount", "Estimated Returns"],
      datasets: [{
        data: [Math.round(invested), Math.round(returns)],
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
