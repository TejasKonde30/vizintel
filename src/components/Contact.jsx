import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPaperPlane, FaTicketAlt } from "react-icons/fa";

const Contact = () => {
  const navigate = useNavigate();
  const userId = useSelector((state) => state.auth.user);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoadingTickets(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/support/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch tickets");
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchTickets();
  }, [userId]);

  const submitTicket = async () => {
    if (!message.trim()) return alert("Message cannot be empty!");
    if (!userId) return alert("User not authenticated!");

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
        credentials: "include",
      });

      if (response.ok) {
        const newTicket = await response.json();
        const ticketWithStatus = {
          ...newTicket,
          status: newTicket.status || "Pending",
        };
        setTickets([...tickets, ticketWithStatus]);
        setMessage("");
        alert("Ticket submitted!");
      } else {
        alert("Failed to submit ticket!");
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Error submitting ticket!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 flex flex-col items-center">
      {/* Header Section */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-4">
          User Support Dashboard
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
          Submit a support ticket or view your existing tickets. Our team is here
          to help!
        </p>
      </motion.div>

      {/* Ticket Submission Form */}
      <motion.div
        className="w-full max-w-2xl bg-gray-900 p-8 rounded-lg shadow-lg mb-12"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-orange-500 mb-6">
          Submit a New Ticket
        </h2>
        {!userId ? (
          <p className="text-red-400">
            Please log in to submit a ticket.
          </p>
        ) : (
          <>
            <textarea
              className="w-full p-4 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 transition duration-300"
              placeholder="Describe your issue..."
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              onClick={submitTicket}
              className={`mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md flex items-center gap-2 ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-orange-600"
              } transition duration-300`}
              disabled={isSubmitting}
            >
              <FaPaperPlane />
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </>
        )}
      </motion.div>

      {/* Tickets Section */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-orange-500 mb-6">
          Your Tickets
        </h2>
        {isLoadingTickets ? (
          <p className="text-gray-400">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-400">No tickets found.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket._id}
                className="bg-gray-900 p-6 rounded-lg shadow-lg flex items-start gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <FaTicketAlt className="text-2xl text-orange-500" />
                <div className="flex-1">
                  <p className="text-gray-300">{ticket.message}</p>
                  <p
                    className={`text-sm font-semibold mt-2 ${
                      ticket.status === "Resolved"
                        ? "text-green-400"
                        : ticket.status === "Rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    Status: {ticket.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Contact;

