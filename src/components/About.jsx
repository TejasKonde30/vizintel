import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChartLine, FaUsers, FaFileAlt } from "react-icons/fa";


const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center py-12">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-4">
          About VizIntel
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
          Empowering businesses with intelligent data visualization and management
          tools to drive informed decisions.
        </p>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-start gap-4">
          <FaChartLine className="text-3xl text-orange-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Data Visualization
            </h3>
            <p className="text-gray-300">
              Transform complex datasets into intuitive charts and dashboards for
              actionable insights.
            </p>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-start gap-4">
          <FaUsers className="text-3xl text-orange-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              User Management
            </h3>
            <p className="text-gray-300">
              Securely manage users and roles with our robust admin tools.
            </p>
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-start gap-4">
          <FaFileAlt className="text-3xl text-orange-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              File Uploads
            </h3>
            <p className="text-gray-300">
              Seamlessly upload and analyze Excel files with real-time processing.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Team Section */}
      <motion.div
        className="mt-12 text-center max-w-3xl w-full px-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-orange-500 mb-6">Our Team</h2>
        <p className="text-gray-300">
          We are a passionate team of developers, designers, and data scientists
          dedicated to building cutting-edge solutions for data-driven businesses.
          Our mission is to simplify data management and visualization for all.
        </p>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <p className="text-gray-300 mb-4">
          Ready to take control? Access admin features now.
        </p>
      </motion.div>
    </div>
  );
};

export default About;