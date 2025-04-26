import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavbarH";
import { FaChartLine, FaBrain, FaSync, FaLock, FaChevronDown, FaChevronUp, FaLinkedin, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, Line, Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";

const MainSection = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [faqOpen, setFaqOpen] = useState({});
  const navigate = useNavigate();

  const toggleForm = () => setIsLogin(!isLogin);

  const handleGetStarted = () => {
    navigate(isLogin ? "/login" : "/register");
  };

  const toggleFaq = (index) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Sample chart data
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Dataset Values",
        data: [50, 75, 60, 80, 90],
        backgroundColor: "rgba(249, 115, 22, 0.5)",
        borderColor: "#f97316",
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const barData = {
    labels: ["Dataset A", "Dataset B", "Dataset C"],
    datasets: [
      {
        label: "Total Values",
        data: [120, 150, 100],
        backgroundColor: "#f97316",
        borderColor: "#f97316",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: ["Category 1", "Category 2", "Category 3"],
    datasets: [
      {
        label: "Data Distribution",
        data: [40, 30, 20],
        backgroundColor: ["#f97316", "#eab308", "#22c55e"],
        borderColor: "#1f2937",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#d1d5db" },
      },
      title: {
        display: true,
        color: "#d1d5db",
        font: { size: 14 },
      },
    },
    scales: {
      x: { ticks: { color: "#d1d5db" }, grid: { color: "#374151" } },
      y: {
        ticks: { color: "#d1d5db" },
        grid: { color: "#374151" },
        beginAtZero: true,
      },
    },
  };

  // Features data
  const features = [
    {
      icon: <FaChartLine className="text-4xl text-orange-500" />,
      title: "2D/3D Visualizations",
      description: "Create stunning graphs to visualize complex datasets with ease.",
    },
    {
      icon: <FaBrain className="text-4xl text-orange-500" />,
      title: "AI-Driven Insights",
      description: "Uncover hidden trends with our intelligent analytics engine.",
    },
    {
      icon: <FaSync className="text-4xl text-orange-500" />,
      title: "Real-Time Updates",
      description: "Stay current with live data feeds and instant updates.",
    },
    {
      icon: <FaLock className="text-4xl text-orange-500" />,
      title: "Secure & Scalable",
      description: "Built with MongoDB and Node.js for robust performance.",
    },
  ];

  // Testimonials data (fictional)
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Data Analyst",
      quote: "VizIntel transformed how I analyze data. The 3D graphs are a game-changer!",
    },
    {
      name: "Michael Chen",
      role: "Business Owner",
      quote: "The AI insights helped me make smarter decisions faster. Highly recommend!",
    },
  ];

  // FAQs
  const faqs = [
    {
      question: "What is VizIntel?",
      answer: "VizIntel is a MERN-based platform for creating interactive 2D/3D visualizations and uncovering AI-driven insights from your data.",
    },
    {
      question: "How secure is my data?",
      answer: "We use industry-standard encryption and MongoDB’s secure storage to protect your data. See our Privacy Policy for details.",
    },
    {
      question: "Can I try VizIntel for free?",
      answer: "Yes! Sign up for a free trial to explore all features with no commitment.",
    },
  ];

  return (
    <div className="bg-black text-white min-h-screen">

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative py-24 px-6 md:px-12 bg-gradient-to-r from-black via-gray-900 to-black min-h-screen flex items-center"
      >
        <div className="container mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl md:text-6xl font-extrabold mb-4 text-orange-500"
          >
            Discover Insights with VizIntel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl mb-8 text-gray-300 max-w-3xl mx-auto"
          >
            Build interactive 2D/3D graphs, analyze trends, and unlock AI-driven insights. Start visualizing your data today.
          </motion.p>
          <div className="flex justify-center">
            <motion.button
              onClick={handleGetStarted}
              className="bg-orange-500 text-black font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition duration-300 shadow-lg hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Get Started with VizIntel"
            >
              Get Started
            </motion.button>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/hero-placeholder.jpg')] bg-cover bg-center opacity-20"></div>
      </motion.section>

      {/* Demo Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-12 bg-black rounded-2xl shadow-lg"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-500 mb-8">
          Explore Our Data Visualizations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            className="bg-gray-900 p-4 rounded-lg shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-md font-semibold text-orange-500 mb-4">
              Dataset Totals
            </h4>
            <div className="relative h-64">
              <Bar
                data={barData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: { text: "Dataset Totals" },
                  },
                }}
              />
            </div>
          </motion.div>
          <motion.div
            className="bg-gray-900 p-4 rounded-lg shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-md font-semibold text-orange-500 mb-4">
              Value Trends
            </h4>
            <div className="relative h-64">
              <Line
                data={chartData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: { text: "Value Trends" },
                  },
                }}
              />
            </div>
          </motion.div>
          <motion.div
            className="bg-gray-900 p-4 rounded-lg shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-md font-semibold text-orange-500 mb-4">
              Data Distribution
            </h4>
            <div className="relative h-64">
              <Pie
                data={pieData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: { text: "Data Distribution" },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 bg-black"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-500 mb-8">
          Why Choose VizIntel?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:scale-105 hover:shadow-xl transition duration-300 ease-in-out"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 bg-black"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-500 mb-8">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-gray-900 p-6 rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition duration-300 ease-in-out"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
              <p className="text-white font-semibold">{testimonial.name}</p>
              <p className="text-gray-300 text-sm">{testimonial.role}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-gray-300 mt-8">Trusted by 1,000+ users worldwide</p>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 bg-black"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-500 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-gray-900 rounded-lg mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button
                  className="w-full flex justify-between items-center p-4 text-left text-white"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={faqOpen[index]}
                  aria-controls={`faq-${index}`}
                >
                  <span className="text-lg">{faq.question}</span>
                  {faqOpen[index] ? (
                    <FaChevronUp className="text-orange-500" />
                  ) : (
                    <FaChevronDown className="text-orange-500" />
                  )}
                </button>
                <AnimatePresence>
                  {faqOpen[index] && (
                    <motion.div
                      id={`faq-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="p-4 text-gray-300 bg-gray-900 rounded-b-lg"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Footer Section */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* About VizIntel */}
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-4">About VizIntel</h3>
              <p className="text-gray-300">
                VizIntel is a cutting-edge MERN application that empowers users to create interactive 2D/3D visualizations, uncover AI-driven insights, and manage data with a scalable backend.
              </p>
            </div>
            {/* Legal Links */}
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-4">Legal</h3>
              <ul className="text-gray-300">
                <li>
                  <a href="/privacy-policy" className="hover:text-orange-500 transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-conditions" className="hover:text-orange-500 transition">
                    Terms and Conditions
                  </a>
                </li>
              </ul>
              <p className="text-gray-300 text-sm mt-4">
                We collect minimal personal data to enhance your experience. See our Privacy Policy for details.
              </p>
            </div>
            {/* Team Members and Contact */}
            <div>
              <h3 className="text-xl font-semibold text-orange-500 mb-4">Our Team</h3>
              <div className="mb-4">
                <p className="text-white font-semibold">Aniket Singh</p>
                <div className="flex gap-4 mt-2">
                  <a
                    href="https://www.linkedin.com/in/aniket-singh-873404239"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Aniket Singh LinkedIn"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://www.instagram.com/aniketmsingh?igsh=YnJ5b2U2c3ZuMzNn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Aniket Singh Instagram"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://x.com/AniketS86074960?t=P6OB6ROsFcWc8Iix6lr9rQ&s=09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Aniket Singh X"
                  >
                    <FaTwitter />
                  </a>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-white font-semibold">Tejas Konde</p>
                <div className="flex gap-4 mt-2">
                  <a
                    href="https://www.linkedin.com/in/tejas-konde-3b709020a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Tejas Konde LinkedIn"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://www.instagram.com/tejas.konde?igsh=MW1vb2FtNXZ0cTRxeg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Tejas Konde Instagram"
                  >
                    <FaInstagram />
                  </a>
                  <a
                    href="https://x.com/GamingTeja35782?t=R1D4Gjg6reD7c3rtT93jgw&s=09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-500"
                    aria-label="Aniket Singh X"
                  >
                    <FaTwitter />
                  </a>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-orange-500 mb-4">Contact</h3>
              <p className="text-gray-300 text-sm">
                <a href="mailto:support@vizintel.com" className="hover:text-orange-500">
                  support@vizintel.com
                </a>
              </p>
              <p className="text-gray-300 text-sm">123 Analytics Avenue, Pune, Maharashtra, India</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              © 2025 VizIntel - AI-Powered Data Visualization Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainSection;