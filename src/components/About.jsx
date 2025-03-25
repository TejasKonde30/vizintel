import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-orange-500">About Us</h2>
        <p className="text-gray-300">
          This is the About page. Learn more about our application and team here.
        </p>
      </div>
    </div>
  );
};

export default About;