import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionTypeSelector from "./SessionTypeSelector";
import type { SessionType } from "./SessionTypeSelector";
import { bookingEN } from "@/content/booking";

const mockSessions: SessionType[] = [
  {
    id: "session-1",
    name: "Individual Therapy",
    name_ru: "Индивидуальная терапия",
    description: "One-on-one session.",
    duration_minutes: 50,
    show_price: false,
  },
  {
    id: "session-2",
    name: "Couples Therapy",
    description: "Session for two.",
    duration_minutes: 80,
    show_price: true,
    pricing_type: "solidarity",
    min_price: 50,
    max_price: 150,
    currency: "EUR",
  },
];

const mockWriteText = vi.fn();

beforeEach(() => {
  mockWriteText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

describe("SessionTypeSelector – rendering", () => {
  it("renders all session type names", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Individual Therapy")).toBeInTheDocument();
    expect(screen.getByText("Couples Therapy")).toBeInTheDocument();
  });

  it("renders Russian names when language is ru", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="ru"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText("Индивидуальная терапия")).toBeInTheDocument();
    expect(screen.queryByText("Individual Therapy")).not.toBeInTheDocument();
  });

  it("applies selected styling to the active session card", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        selected="session-1"
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    const selected = screen.getByText("Individual Therapy").closest('[role="radio"]');
    expect(selected).toHaveClass("border-primary");
    const unselected = screen.getByText("Couples Therapy").closest('[role="radio"]');
    expect(unselected).not.toHaveClass("border-primary");
  });

  it("renders loading skeletons while loading", () => {
    const { container } = render(
      <SessionTypeSelector
        sessionTypes={[]}
        loading={true}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders empty state message when no sessions available", () => {
    render(
      <SessionTypeSelector
        sessionTypes={[]}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/no session types available/i)).toBeInTheDocument();
  });

  it("renders sliding scale price range when pricing_type is solidarity", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/sliding scale/i)).toBeInTheDocument();
  });
});

describe("SessionTypeSelector – session selection", () => {
  it("calls onSelect with correct session and index when a card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText("Individual Therapy").closest('[role="radio"]')!);
    expect(onSelect).toHaveBeenCalledWith(mockSessions[0], 0);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect with index 1 for the second session", () => {
    const onSelect = vi.fn();
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText("Couples Therapy").closest('[role="radio"]')!);
    expect(onSelect).toHaveBeenCalledWith(mockSessions[1], 1);
  });
});

describe("SessionTypeSelector – share links", () => {
  it("does not render link icons when getShareUrl is not provided", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
      />
    );
    expect(screen.queryByTitle("Copy link")).not.toBeInTheDocument();
  });

  it("renders one link icon per session when getShareUrl is provided", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
        getShareUrl={(id) => `https://example.com/?session=${id}`}
      />
    );
    expect(screen.getAllByTitle("Copy link")).toHaveLength(2);
  });

  it("copies the correct URL for the first session", async () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
        getShareUrl={(id) => `https://example.com/?session=${id}`}
      />
    );
    fireEvent.click(screen.getAllByTitle("Copy link")[0]);
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        "https://example.com/?session=session-1"
      );
    });
  });

  it("copies the correct URL for the second session", async () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={vi.fn()}
        getShareUrl={(id) => `https://example.com/?session=${id}`}
      />
    );
    fireEvent.click(screen.getAllByTitle("Copy link")[1]);
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        "https://example.com/?session=session-2"
      );
    });
  });

  it("does not call onSelect when the link icon is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="en"
        onSelect={onSelect}
        getShareUrl={(id) => `https://example.com/?session=${id}`}
      />
    );
    fireEvent.click(screen.getAllByTitle("Copy link")[0]);
    await waitFor(() => expect(mockWriteText).toHaveBeenCalled());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders Russian link title when language is ru", () => {
    render(
      <SessionTypeSelector
        sessionTypes={mockSessions}
        loading={false}
        t={bookingEN}
        language="ru"
        onSelect={vi.fn()}
        getShareUrl={(id) => `https://example.com/?session=${id}`}
      />
    );
    expect(screen.getAllByTitle("Скопировать ссылку")).toHaveLength(2);
    expect(screen.queryByTitle("Copy link")).not.toBeInTheDocument();
  });
});
