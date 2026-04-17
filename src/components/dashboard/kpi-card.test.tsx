import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";

import { KpiCard } from "./kpi-card";

describe("<KpiCard />", () => {
  it("renders the label, value and hint", () => {
    render(
      <KpiCard
        label="Total Leads"
        value={42}
        icon={Users}
        hint="vs. semana anterior"
      />,
    );
    expect(screen.getByText("Total Leads")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("vs. semana anterior")).toBeInTheDocument();
  });

  it("shows a positive delta with + sign", () => {
    render(
      <KpiCard
        label="Leads 7d"
        value={10}
        icon={Users}
        delta={{ value: 25 }}
      />,
    );
    expect(screen.getByText("+25%")).toBeInTheDocument();
  });

  it("shows a negative delta without extra sign and proper aria-label", () => {
    render(
      <KpiCard
        label="Leads 7d"
        value={3}
        icon={Users}
        delta={{ value: -15 }}
      />,
    );
    expect(screen.getByText("-15%")).toBeInTheDocument();
    expect(screen.getByLabelText("Variación -15%")).toBeInTheDocument();
  });

  it("renders em-dash when isLoading is true", () => {
    render(
      <KpiCard label="Cargando" value={100} icon={Users} isLoading />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
