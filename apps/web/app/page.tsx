'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import DataSourceSelector from './components/DataSourceSelector';

// Add this array at the top of your file, outside the component
const chartImages = [
  '/charts/Chart01.png',
  '/charts/Chart02.png',
  '/charts/Chart03.png',
];

type SubmitData = {
  type: 'file' | 'sql' | 'web';
  file?: File;
  connection?: string;
  url?: string;
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTryNow = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSubmit = useCallback((data: SubmitData) => {
    setIsLoading(true);
    // Simulating API call
    setTimeout(() => {
      setIsLoading(false);
      setIsModalOpen(false);
      console.log('Submitted data:', data);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen text-base-content">
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="hero min-h-screen bg-gradient-to-br from-base-300 to-base-100 rounded-lg">
          <div className="hero-content text-center">
            <div>
              <h1 className="text-5xl font-bold text-primary">InsightAI BI Assistant</h1>
              <p className="py-6 text-accent">
                Introducing InsightAI, a cutting-edge intelligent analysis tool providing an all-in-one data analysis solution.
              </p>
              <button className="btn btn-primary" onClick={handleTryNow}>Try Now</button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 border-t border-base-300">
          <h2 className="text-3xl font-bold text-center mb-12 text-secondary">Data-Centric Approach, Lowering the Bar for Data Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card bg-base-200 shadow-xl rounded-xl overflow-hidden">
                <figure className="px-6 pt-6">
                  <Image
                    src={chartImages[(i - 1) % chartImages.length]}
                    alt={`Chart ${i}`}
                    width={300}
                    height={200}
                    className="rounded-xl"
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title text-primary">Data Analysis Chart {i}</h3>
                  <p>Brief description of data analysis chart {i}.</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Application Value Section */}
        <section className="py-16 border-t border-base-300">
          <h2 className="text-3xl font-bold text-center mb-8 text-secondary">Why Choose ChatBI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Intuitive Data Interaction',
                description: 'Engage with your data through natural language queries, making complex analysis accessible to all team members, regardless of their technical expertise.'
              },
              {
                title: 'Real-time Insights',
                description: 'Get instant answers and visualizations as you chat, enabling faster decision-making and reducing the time from question to insight.'
              },
              {
                title: 'AI-Powered Analytics',
                description: 'Leverage advanced machine learning algorithms that understand context, suggest relevant analyses, and uncover hidden patterns in your data.'
              },
              {
                title: 'Seamless Integration',
                description: 'Easily connect with your existing data sources and tools, allowing for a smooth incorporation of ChatBI into your current workflow and processes.'
              }
            ].map((value, index) => (
              <div key={index} className="card bg-base-200 shadow-xl rounded-xl">
                <div className="card-body items-center text-center">
                  <h3 className="card-title text-primary">{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 border-t border-base-300">
          <h2 className="text-3xl font-bold text-center mb-8 text-secondary">What Can Our Chat BI Assistant Do?</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Data Import & Connection',
                description: 'Easily import Excel, CSV, JSON files, or connect directly to your databases for seamless data access.'
              },
              {
                title: 'Conversational Analytics',
                description: 'Ask questions about your data in natural language and receive instant insights, charts, and visualizations.'
              },
              {
                title: 'Automated Reporting',
                description: 'Generate comprehensive reports and dashboards through simple chat interactions, saving hours of manual work.'
              },
              {
                title: 'Predictive Insights',
                description: 'Leverage AI to uncover trends, anomalies, and future projections based on your historical data.'
              }
            ].map((useCase, index) => (
              <div key={index} className="card bg-base-200 shadow-xl rounded-xl">
                <div className="card-body">
                  <h3 className="card-title text-primary">{useCase.title}</h3>
                  <p>{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 border-t border-base-300">
          <h2 className="text-3xl font-bold text-center mb-8 text-secondary">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              'How to start using InsightAI?',
              'What data sources are supported?',
              'How is data security ensured?',
              'Are customization options available?'
            ].map((question, index) => (
              <div key={index} className="collapse collapse-plus bg-base-200 rounded-xl">
                <input type="radio" name="faq-accordion" />
                <div className="collapse-title text-xl font-medium text-primary">
                  {question}
                </div>
                <div className="collapse-content">
                  <p>Detailed answer to &quot;{question}&quot;.</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded-lg">
        <div className="grid grid-flow-col gap-4">
          <a className="link link-hover">About Us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Privacy Policy</a>
        </div>
        <div>
          <p>Copyright © 2023 - All rights reserved by Chatbi team</p>
        </div>
      </footer>

      <DataSourceSelector isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
