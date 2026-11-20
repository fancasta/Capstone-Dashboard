import { fireEvent, render, screen } from "@testing-library/react";
import DataSummary from "./DataSummary";
import { summarizeReports } from "./disclosures";

const reports = [
  { year: 2024, industry: "Energy", hasNetZeroGoal: 1 },
  { year: "2024", industry: "Energy", hasNetZeroGoal: null },
  { year: 2023, industry: "Transport", hasNetZeroGoal: "1" },
];

test("counts affirmative flags at report grain across numeric and text years", () => {
  const group = summarizeReports(reports).get("2024").get("Energy");
  expect(group.total).toBe(2);
  expect(group.counts.hasNetZeroGoal).toBe(1);
  expect(group.counts.hasProtocol).toBe(0);
  expect(summarizeReports(reports).get("2023").get("Transport").counts.hasNetZeroGoal).toBe(1);
});

test("handles empty results, incoming data and years with different industries", () => {
  const { rerender } = render(<DataSummary Reports={[]} />);
  expect(screen.getByText("No reports available.")).toBeInTheDocument();
  rerender(<DataSummary Reports={reports} />);
  expect(screen.getByLabelText("Industry")).toHaveValue("Energy");
  expect(screen.getByText(/2 reports in this selection/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Reporting year"), { target: { value: "2023" } });
  expect(screen.getByLabelText("Industry")).toHaveValue("Transport");
  expect(screen.getByText(/1 report in this selection/)).toBeInTheDocument();
});
