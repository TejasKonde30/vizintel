import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import Navbar from "./NavbarH";

const clientId = "707979060917-pvhb5npqbqed3c7vsqg530n2hbls1qik.apps.googleusercontent.com";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      setMessage("Login successful");
      const userData = {
        email,
        token: response.data.authToken,
        name: response.data.name,
        identity: response.data.identity || 0,
      };
      dispatch(loginSuccess(userData));
      document.cookie = `authToken=${userData.token}; path=/; max-age=604800; Secure`;
      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (data) => {
    setIsLoading(true);
    setMessage("");
    const { credential } = data;
    try {
      const response = await axios.post("http://localhost:5000/auth/google", { token: credential });
      setMessage("Login successful");
      const userData = {
        email: response.data.email,
        token: response.data.authToken,
        name: response.data.name,
        identity: response.data.identity || 0,
      };
      dispatch(loginSuccess(userData));
      document.cookie = `authToken=${userData.token}; path=/; max-age=604800; Secure`;
      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
    } catch (error) {
      setMessage("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <motion.div
          className="w-full max-w-md p-8 rounded-xl shadow-2xl border border-gray-600 bg-gray-900"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">User Login</h2>

          {/* Message Display */}
          {message && (
            <motion.p
              className={`text-center p-2 rounded-lg ${message === "Login successful" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {message}
            </motion.p>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 mt-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-1/2 p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                  </svg>
                ) : null}
                {isLoading ? "Logging in..." : "Login"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="w-1/2 p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition duration-300"
              >
                Register
              </button>
            </div>
          </form>

          {/* Google Login */}
          <div className="mt-6">
            <div className="flex items-center justify-center my-4">
              <div className="flex-grow h-px bg-gray-600"></div>
              <span className="mx-4 text-gray-400 text-sm">OR</span>
              <div className="flex-grow h-px bg-gray-600"></div>
            </div>
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setMessage("Google login failed")}
                render={(renderProps) => (
                  <button
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled || isLoading}
                    className="w-full p-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition duration-300 flex items-center justify-center disabled:opacity-50"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.36 7.77 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.77 1 4.01 3.64 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    {isLoading ? "Processing..." : "Sign in with Google"}
                  </button>
                )}
              />
            </GoogleOAuthProvider>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;