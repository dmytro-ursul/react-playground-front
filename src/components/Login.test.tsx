import React from "react";
import { render } from "@testing-library/react";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { store } from "../store";
import Login from "./Login";
import { server } from "../mocks/server";
import { BrowserRouter as Router } from "react-router-dom";

describe("Login Component", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("renders the Login component", () => {
    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
  });

  it("updates input fields and submits the form", async () => {
    const mockData = {
      user: {
        firstName: "John",
        lastName: "Doe",
      },
      token: "your-token",
    };

    // Mock the fetch request
    jest.spyOn(window, "fetch").mockImplementationOnce(() => {
      return Promise.resolve({
        json: () => Promise.resolve(mockData),
      } as Response);
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("username"), {
      target: { value: "testuser" },
    });

    fireEvent.change(screen.getByPlaceholderText("password"), {
      target: { value: "testpassword" },
    });

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => expect(store.getState().auth.token).not.toBeNull());
  });
});
