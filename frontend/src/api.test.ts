import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getApiError, getFieldErrors } from "./api";

function apiError(data: unknown): AxiosError {
  return {
    isAxiosError: true,
    response: { status: 422, data },
  } as unknown as AxiosError;
}

describe("getApiError", () => {
  it("prefers a top-level API message", () => {
    expect(
      getApiError(
        apiError({ error: "email already registered", errors: { email: ["Taken"] } }),
        "Fallback",
      ),
    ).toBe("email already registered");
  });

  it("formats validation errors", () => {
    expect(
      getApiError(
        apiError({ errors: { email: ["Invalid", "Taken"], role: "Unknown" } }),
        "Fallback",
      ),
    ).toBe("email: Invalid, Taken; role: Unknown");
  });

  it("uses the fallback for non-API errors", () => {
    expect(getApiError(new Error("network down"), "Failed to save")).toBe(
      "Failed to save",
    );
  });
});

describe("getFieldErrors", () => {
  it("maps array and string errors to field messages", () => {
    expect(
      getFieldErrors(apiError({ errors: { email: ["Invalid", "Taken"], role: "Unknown" } })),
    ).toEqual({ email: "Invalid, Taken", role: "Unknown" });
  });

  it("returns no fields when the error is not a validation response", () => {
    expect(getFieldErrors(apiError({ error: "Not found" }))).toEqual({});
    expect(getFieldErrors(new Error("network down"))).toEqual({});
  });
});
