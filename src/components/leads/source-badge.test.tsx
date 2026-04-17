import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SourceBadge } from "./source-badge";

describe("<SourceBadge />", () => {
  it("renders the localized Spanish label for each source", () => {
    const { rerender } = render(<SourceBadge source="instagram" />);
    expect(screen.getByText("Instagram")).toBeInTheDocument();

    rerender(<SourceBadge source="landing_page" />);
    expect(screen.getByText("Landing Page")).toBeInTheDocument();

    rerender(<SourceBadge source="referido" />);
    expect(screen.getByText("Referido")).toBeInTheDocument();
  });
});
