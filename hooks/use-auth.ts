import axios from "axios";

export const useAuth = async () => {
  const response = await axios.get("http://localhost:4000//api/auth/me");
  if (response.status === 200) {
    // add barear token to local storage
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return true;
  }
  return false;
};
export const registerToAccount = async (
  email: string,
  password: string,
  name: string,
  confirmPassword: string,
  role: "admin" | "instructor" | "student",
  studentId: string,
  department: string
) => {
  let res;
  if (role === "admin" || role === "instructor") {
    res = await axios.post("http://localhost:4000/api/auth/register", {
      email,
      password,
      name,
      role,
      confirmPassword,
      studentId,
    });
    if (res.status === 200) {
      return true;
    }
  }
  if (role === "student") {
    res = await axios.post("http://localhost:4000/api/auth/register", {
      email,
      password,
      name,
      role,
      confirmPassword,
      studentId,
      department,
    });
    if (res.status === 200) {
      return true;
    }
  }

  return false;
};

export const logIn = async (email: string, password: string) => {
    try {
      const response = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      }, {
        withCredentials: true,
          headers: {
            "Content-Type": "application/json"
        }
      });
  
      if (response.status === 200) {
        // Store the token and user details in localStorage
        localStorage.setItem("token", response.data.token);
        const userData = await axios.get('http://localhost:4000/api/auth/me' ,
          {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          }
        )

        console.log(userData)
        localStorage.setItem("user", JSON.stringify(userData.data.data.name));
        localStorage.setItem("role", JSON.stringify(userData.data.data.role));
  
        return true;
      }
    } catch (error: any) {
      console.log(error)
      if (error.response?.status === 401) {
        alert("Invalid email or password");
      } else {
        console.error("Login failed:", error.message);
        alert("An error occurred. Please try again later.");
      }
    }
  
    return false;
  };
export const useLogout = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return true;
};

export const useUpdatePassword = async (currentPassword: string, newPassword: string) => {
  const response = await axios.post(
    "http://localhost:4000/api/auth/update-password",
    {
      currentPassword,
      newPassword,
    },
    
    // add barear token to axios
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  if (response.status === 200) {
    return true;
  }
  return false;
};
