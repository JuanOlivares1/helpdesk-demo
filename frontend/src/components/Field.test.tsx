import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Field from "./Field";

interface ExampleProps {
  error?: string;
}

function Example({ error }: ExampleProps) {
  return (
    <Field label="Email" hint="We never share it" error={error}>
      {({ id, invalid, describedBy }) => (
        <input
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
      )}
    </Field>
  );
}

describe("Field", () => {
  it("associates the label and hint with the control", () => {
    render(<Example />);

    const input = screen.getByLabelText("Email");
    const hint = screen.getByText("We never share it");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input.getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("marks the control invalid and links the error message", () => {
    render(<Example error="Email is required" />);

    const input = screen.getByLabelText("Email");
    const error = screen.getByText("Email is required");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(error).toHaveAttribute("aria-live", "polite");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
  });
});
