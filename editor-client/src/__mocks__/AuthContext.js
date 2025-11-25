jest.mock("../AuthContext", () => ({
  useAuth: () => ({
    user: { username: "Archit", user_id: 1 },
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));
