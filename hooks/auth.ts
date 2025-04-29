import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;

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