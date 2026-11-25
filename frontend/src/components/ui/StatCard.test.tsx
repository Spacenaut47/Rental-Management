import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders a metric with an icon", () => {
    render(<StatCard label="Properties" value={4} hint="Managed locations" icon={Building2} />);

    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows a placeholder while data is unavailable", () => {
    render(<StatCard label="Properties" value={undefined} hint="Loading" icon={Building2} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
