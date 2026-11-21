import { render, screen } from "@testing-library/react";
import axios from "axios";
import App from "./App";

jest.mock("axios", () => ({ get: jest.fn() }));

test("the local reporting workspace loads its disclosure summary from the report endpoint", async () => {
  axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
    data: [{ year: 2024, industry: "Manufacturing", hasNetZeroGoal: true }],
  });
  window.history.replaceState({}, "", "/workspace");
  render(<App />);
  expect(await screen.findByText(/1 report in this selection/)).toBeInTheDocument();
  expect(screen.getByLabelText("Industry")).toHaveValue("Manufacturing");
  expect(axios.get).toHaveBeenCalledWith("http://localhost:6868/report");
});
