function calculateFI() {
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

  const fiAge = age + years;

  if (corpus >= target) {
    document.getElementById("output").innerText =
      `You can achieve Financial Independence at approximately age ${fiAge}.`;
  } else {
    document.getElementById("output").innerText =
      "Target not achievable with current inputs.";
  }
}
