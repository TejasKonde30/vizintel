import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavbarH";
import { FaReact, FaNodeJs, FaDatabase } from "react-icons/fa";
import { motion } from "framer-motion";
import Chart from "chart.js/auto";

const MainSection = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  const toggleForm = () => setIsLogin(!isLogin);

  const handleGetStarted = () => {
    navigate(isLogin ? "/login" : "/register");
  };

  const handleDemoToggle = () => {
    setShowDemo(!showDemo);
    if (!showDemo) {
      setTimeout(() => {
        const ctx = document.getElementById("demoChart")?.getContext("2d");
        if (ctx) {
          new Chart(ctx, {
            type: "bar",
            data: {
              labels: ["Data 1", "Data 2", "Data 3"],
              datasets: [{
                label: "Sample Data",
                data: [10, 20, 15],
                backgroundColor: "rgba(255, 99, 132, 0.8)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              }],
            },
            options: {
              responsive: true,
              scales: { y: { beginAtZero: true } },
            },
          });
        }
      }, 100);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative py-24 px-6 md:px-12 bg-gradient-to-r from-black via-gray-900 to-black"
      >
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-orange-500">
            Welcome to My AI-Powered Platform
          </h1>
          <p className="text-lg md:text-xl mb-6 text-gray-300 max-w-2xl mx-auto">
            Build interactive 2D/3D graphs, analyze trends, and uncover insights with ease. Join today and experience the future of data analytics.
          </p>
          <div className="flex justify-center gap-4">
            {/* <button
              onClick={handleGetStarted}
              className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
            >
              {isLogin ? "Login" : "Register"}
            </button> */}
            <button
              onClick={handleDemoToggle}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
            >
              {showDemo ? "Hide Demo" : "View Demo"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Demo Section (appears when "View Demo" is clicked) */}
      {showDemo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8 bg-gray-900 rounded-lg shadow-lg"
        >
          <h3 className="text-2xl font-semibold text-center text-white mb-4">
            Quick Graph Demo
          </h3>
          <div className="flex justify-center">
            <canvas id="demoChart" width="300" height="200"></canvas>
          </div>
        </motion.div>
      )}

      {/* Project Info Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="container mx-auto px-4 py-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-8">
          Welcome to My Project
        </h2>
        <p className="text-center text-base md:text-lg text-gray-400 mb-4 max-w-3xl mx-auto">
          This is a full-stack MERN application with AI-driven insights, 2D/3D graph visualizations, and more.
        </p>
        <p className="text-center text-base md:text-lg text-gray-400 max-w-3xl mx-auto">
          The project features user authentication, real-time updates, and a scalable backend with MongoDB and Node.js.
        </p>
      </motion.div>

      {/* Tech Stack Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="container mx-auto px-4 py-16"
      >
        <h3 className="text-2xl md:text-3xl font-semibold text-center text-white mb-6">
          Technologies Used
        </h3>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <div className="relative group flex flex-col items-center">
            <FaReact className="text-5xl md:text-6xl text-blue-500 mb-2 transition-transform group-hover:scale-110" />
            <p className="text-base md:text-lg text-gray-300">React</p>
            <div className="absolute bottom-16 hidden group-hover:block bg-gray-800 text-white text-sm p-2 rounded-lg">
              Frontend library for building dynamic UIs
            </div>
          </div>
          <div className="relative group flex flex-col items-center">
            <FaNodeJs className="text-5xl md:text-6xl text-green-500 mb-2 transition-transform group-hover:scale-110" />
            <p className="text-base md:text-lg text-gray-300">Node.js</p>
            <div className="absolute bottom-16 hidden group-hover:block bg-gray-800 text-white text-sm p-2 rounded-lg">
              Backend runtime for scalable server-side logic
            </div>
          </div>
          <div className="relative group flex flex-col items-center">
            <FaDatabase className="text-5xl md:text-6xl text-yellow-500 mb-2 transition-transform group-hover:scale-110" />
            <p className="text-base md:text-lg text-gray-300">MongoDB</p>
            <div className="absolute bottom-16 hidden group-hover:block bg-gray-800 text-white text-sm p-2 rounded-lg">
              NoSQL database for flexible data storage
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Section */}
      <div className="bg-gray-900 py-6">
        <div className="container mx-auto text-center">
          <p className="text-gray-500">&copy; 2025 AI-Powered Data Visualization Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default MainSection;


