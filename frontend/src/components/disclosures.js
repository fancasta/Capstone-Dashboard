export const indicators = [
  ["emissionAmountVerified", "Verified emissions amounts"],
  ["hasActiveProgram", "Active biodiversity programme"],
  ["hasNetZeroGoal", "Net-zero goal"],
  ["hasProtocol", "Reporting protocol"],
  ["emissionTargetVerified", "Verified emissions target"],
  ["hasTransitionPlan", "Transition plan"],
  ["hasLeadershipIncentive", "Leadership incentive"],
  ["hasSupplierEngagement", "Supplier engagement"],
  ["hasValueChainEngagement", "Value-chain engagement"],
];

// Each input row represents one report. Only affirmative flags add to a count.
export function summarizeReports(reports) {
  const byYear = new Map();
  for (const report of reports) {
    const year = String(report.year);
    if (!byYear.has(year)) byYear.set(year, new Map());
    const industries = byYear.get(year);
    if (!industries.has(report.industry)) {
      industries.set(report.industry, {
        total: 0, counts: Object.fromEntries(indicators.map(([field]) => [field, 0])),
      });
    }
    const group = industries.get(report.industry);
    group.total += 1;
    for (const [field] of indicators) {
      const value = report[field];
      if (value === true || value === 1 || value === "1") group.counts[field] += 1;
    }
  }
  return byYear;
}
