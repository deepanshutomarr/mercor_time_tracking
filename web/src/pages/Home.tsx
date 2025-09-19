import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, BarChart3, Shield, Download, ArrowRight } from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Track Time, Boost Productivity
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Professional time tracking solution for remote teams. Monitor work hours, 
          capture screenshots, and generate detailed reports with ease.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/download"
            className="btn btn-primary btn-lg inline-flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Desktop App
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          <Link
            to="/login"
            className="btn btn-outline btn-lg"
          >
            Employee Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">
            Everything you need for time tracking
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful features designed for modern remote teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Clock className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Time Tracking</h3>
              </div>
              <p className="text-gray-600">
                Start and stop time tracking with a single click. Automatic 
                duration calculation and session management.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Screenshot Capture</h3>
              </div>
              <p className="text-gray-600">
                Automatic screenshot capture during work sessions with 
                privacy controls and permission management.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Analytics & Reports</h3>
              </div>
              <p className="text-gray-600">
                Detailed analytics and reports for projects, tasks, and 
                employee productivity insights.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Team Management</h3>
              </div>
              <p className="text-gray-600">
                Manage employees, projects, and tasks. Assign team members 
                and track their progress.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Security & Privacy</h3>
              </div>
              <p className="text-gray-600">
                Enterprise-grade security with device fingerprinting, 
                IP tracking, and secure data storage.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Download className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Cross-Platform</h3>
              </div>
              <p className="text-gray-600">
                Desktop application available for Windows, macOS, and Linux. 
                Web interface for management and reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Download the desktop application and start tracking your time today. 
          Perfect for freelancers, remote teams, and agencies.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/download"
            className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg inline-flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Now
          </Link>
          <Link
            to="/login"
            className="btn border-white text-white hover:bg-white hover:text-primary-600 btn-lg"
          >
            Employee Login
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
