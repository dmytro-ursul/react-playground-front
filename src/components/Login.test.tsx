import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../store";
import Login from "./Login";
import { MemoryRouter } from "react-router-dom";

// Skip MSW tests due to Node.js compatibility issues with MSW v2
// TODO: Update MSW setup for Node 18+ or use different mocking approach

describe("Login Component", () => {
  const renderLogin = () =>
    render(
      <Provider store={store}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Login />
        </MemoryRouter>
      </Provider>
    );

  it("renders the Login component", () => {
    renderLogin();

    expect(screen.getByPlaceholderText("Enter your username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  });

  it("updates input fields", async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter your username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpassword" },
    });

    expect(screen.getByPlaceholderText("Enter your username")).toHaveValue("testuser");
    expect(screen.getByPlaceholderText("Enter your password")).toHaveValue("testpassword");
  });

  it("renders login button", () => {
    renderLogin();

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });
});
