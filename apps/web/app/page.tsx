import Image from 'next/image';

// Add this array at the top of your file, outside the component
const chartImages = [
  '/charts/Chart01.png',
  '/charts/Chart02.png',
  '/charts/Chart03.png',
];

export default async function Home() {
  // const { users } = await trpc.getUsers.query();
  // const { greeting } = await trpc.sayHello.query({ name: 'Bruce' });

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="hero min-h-screen bg-gradient-to-br from-base-300 to-base-100 rounded-lg">
          <div className="hero-content text-center">
            <div>
              <h1 className="text-5xl font-bold text-primary">InsightAI BI Assistant</h1>
              <p className="py-6 text-accent">
                Introducing InsightAI, a cutting-edge intelligent analysis tool providing an all-in-one data analysis solution.
              </p>
              <button className="btn btn-primary">Try Now</button>
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
          <h2 className="text-3xl font-bold text-center mb-8 text-secondary">Application Value</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {['Improved Efficiency', 'Lower Entry Barrier', 'Personalized Analysis'].map((value, index) => (
              <div key={index} className="card w-96 bg-base-200 shadow-xl rounded-xl">
                <div className="card-body items-center text-center">
                  <h3 className="card-title text-primary">{value}</h3>
                  <p>Detailed description about {value}.</p>
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
    </div>
  );
}
