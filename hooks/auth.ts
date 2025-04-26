import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export const logIn = async (email: string, password: string) => {
  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password,
    });

    // Save token (if any) to localStorage or cookies
    if (response.data?.token) {
      localStorage.setItem("authToken", response.data.token);
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, error: error.response?.data || error.message };
  }
};