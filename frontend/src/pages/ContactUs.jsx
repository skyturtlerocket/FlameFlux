import React, { useState } from 'react';
import Header from '../components/Header';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitContactForm = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const responseText = await response.text();
      let payload = null;
      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        payload = null;
      }
      if (!response.ok) {
        const endpointMissingMessage =
          "Contact endpoint not available in this environment. If you're running locally, use `vercel dev` or deploy to Vercel.";
        const fallbackMessage =
          responseText?.includes('<!DOCTYPE') || responseText?.includes('<html')
            ? endpointMissingMessage
            : 'Failed to send message.';
        throw new Error(payload?.error || fallbackMessage);
      }

      setSubmitStatus({ type: 'success', message: 'Message sent successfully.' });
      setFormData({
        firstName: '',
        lastName: '',
        organization: '',
        email: '',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to send message.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Contact Us</h1>
          <p className="text-gray-300 leading-relaxed text-base sm:text-lg mb-8">
            We welcome questions about FlameFlux, partnerships, and collaboration. Fill out the form
            below to send a message directly to our team.
          </p>
          <form
            onSubmit={submitContactForm}
            className="rounded-xl border border-gray-600/80 bg-gray-800/60 p-6 sm:p-7 space-y-6 shadow-xl shadow-black/20"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-200 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/90 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-200 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/90 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-200 mb-2">
                  Organization
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/90 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/90 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-900/90 px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
            {submitStatus.message && (
              <p className={submitStatus.type === 'success' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
                {submitStatus.message}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
