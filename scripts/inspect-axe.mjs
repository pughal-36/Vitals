import fs from "fs";

function inspect(file) {
  console.log(`\n=== ${file} ===`);
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!data.incomplete || data.incomplete.length === 0) {
    console.log("No incomplete items.");
    return;
  }
  data.incomplete.forEach(inc => {
    console.log(`Rule: ${inc.id} (${inc.help})`);
    inc.nodes.forEach(n => {
      console.log(`  Selector: ${n.target.join(", ")}`);
      console.log(`  HTML: ${n.html}`);
      console.log(`  Summary: ${n.failureSummary}`);
    });
  });
}

inspect("./audit/before/home.axe.json");
inspect("./audit/before/readout.axe.json");
