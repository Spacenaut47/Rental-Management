import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("returns the fallback for empty errors", () => {
    expect(getErrorMessage(null)).toBe("Request failed.");
    expect(getErrorMessage(undefined, "Custom fallback.")).toBe("Custom fallback.");
  });

  it("returns a string error unchanged", () => {
    expect(getErrorMessage("Network down.")).toBe("Network down.");
  });

  it("reads ProblemDetails validation errors", () => {
    const error = {
      status: 400,
      data: {
        title: "One or more validation errors occurred.",
        errors: {
          Username: ["Username is required.", "Username is too short."],
          Email: ["Email is invalid."],
        },
      },
    };

    expect(getErrorMessage(error)).toBe(
      "Username is required.\nUsername is too short.\nEmail is invalid."
    );
  });

  it("prefers detail over message and title", () => {
    const error = {
      data: {
        title: "Conflict",
        message: "A message.",
        detail: "A detail.",
      },
    };

    expect(getErrorMessage(error)).toBe("A detail.");
  });

  it("reads the legacy message field", () => {
    expect(getErrorMessage({ data: { message: "Username already exists." } })).toBe(
      "Username already exists."
    );
  });

  it("falls back to the title", () => {
    expect(getErrorMessage({ data: { title: "Not found" } })).toBe("Not found");
  });

  it("handles string and array payloads", () => {
    expect(getErrorMessage({ data: "Raw failure." })).toBe("Raw failure.");
    expect(
      getErrorMessage({
        data: ["First.", { errorMessage: "Second." }, { code: "Third." }],
      })
    ).toBe('First.\nSecond.\n{"code":"Third."}');
  });

  it("serializes unrecognized object payloads", () => {
    expect(getErrorMessage({ data: { code: 42 } })).toBe('{"code":42}');
    expect(getErrorMessage({ data: { errors: {} } })).toBe('{"errors":{}}');
  });

  it("falls back to the thrown error message", () => {
    expect(getErrorMessage(new Error("Boom."))).toBe("Boom.");
    expect(getErrorMessage({ message: "Plain message." })).toBe("Plain message.");
    expect(getErrorMessage({ error: "Plain error." })).toBe("Plain error.");
  });

  it("uses the fallback for values without a message", () => {
    expect(getErrorMessage(42, "Unavailable.")).toBe("Unavailable.");
    expect(getErrorMessage({ data: null }, "Unavailable.")).toBe("Unavailable.");
  });
});
