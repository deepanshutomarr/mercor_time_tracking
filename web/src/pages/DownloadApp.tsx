import React, { useState, useEffect } from 'react'
import { Download, Monitor, Smartphone, Laptop, CheckCircle, AlertCircle } from 'lucide-react'

interface DownloadInfo {
  platform: string
  version: string
  size: string
  requirements: string
  downloadUrl: string
  checksum: string
}

const DownloadApp: React.FC = () => {
  const [userOS, setUserOS] = useState<string>('')
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null)

  useEffect(() => {
    // Detect user's operating system
    const userAgent = navigator.userAgent.toLowerCase()
    let os = 'unknown'
    
    if (userAgent.includes('win')) {
      os = 'windows'
    } else if (userAgent.includes('mac')) {
      os = 'macos'
    } else if (userAgent.includes('linux')) {
      os = 'linux'
    }
    
    setUserOS(os)
    
    // Set download info based on OS
    const downloadData: Record<string, DownloadInfo> = {
      windows: {
        platform: 'Windows',
        version: '1.0.0',
        size: '45.2 MB',
        requirements: 'Windows 10 or later',
        downloadUrl: '/downloads/mercor-time-tracking-windows.exe',
        checksum: 'sha256:abc123...'
      },
      macos: {
        platform: 'macOS',
        version: '1.0.0',
        size: '52.8 MB',
        requirements: 'macOS 10.15 or later',
        downloadUrl: '/downloads/mercor-time-tracking-macos.dmg',
        checksum: 'sha256:def456...'
      },
      linux: {
        platform: 'Linux',
        version: '1.0.0',
        size: '48.1 MB',
        requirements: 'Ubuntu 18.04 or later',
        downloadUrl: '/downloads/mercor-time-tracking-linux.AppImage',
        checksum: 'sha256:ghi789...'
      }
    }
    
    setDownloadInfo(downloadData[os] || downloadData.windows)
  }, [])

  const handleDownload = () => {
    if (downloadInfo) {
      // In a real app, this would trigger the actual download
      window.open(downloadInfo.downloadUrl, '_blank')
    }
  }

  const getOSIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return <Monitor className="h-8 w-8" />
      case 'macos':
        return <Laptop className="h-8 w-8" />
      case 'linux':
        return <Smartphone className="h-8 w-8" />
      default:
        return <Monitor className="h-8 w-8" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Download Desktop App
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get the full Mercor Time Tracking experience with our desktop application. 
          Automatic screenshot capture, offline support, and advanced features.
        </p>
      </div>

      {/* Main Download Card */}
      {downloadInfo && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  {getOSIcon(downloadInfo.platform)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Mercor Time Tracking for {downloadInfo.platform}
                  </h2>
                  <p className="text-gray-600">
                    Version {downloadInfo.version} • {downloadInfo.size}
                  </p>
                  <p className="text-sm text-gray-500">
                    {downloadInfo.requirements}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="btn btn-primary btn-lg inline-flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Download for {downloadInfo.platform}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">Automatic Screenshots</h3>
            </div>
            <p className="text-gray-600">
              Automatic screenshot capture during work sessions with configurable intervals.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">Offline Support</h3>
            </div>
            <p className="text-gray-600">
              Continue tracking time even when offline. Data syncs when connection is restored.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">System Integration</h3>
            </div>
            <p className="text-gray-600">
              Deep system integration with activity monitoring and idle detection.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">Privacy Controls</h3>
            </div>
            <p className="text-gray-600">
              Granular privacy controls with screenshot blurring and sensitive data protection.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">Real-time Sync</h3>
            </div>
            <p className="text-gray-600">
              Real-time synchronization with the web dashboard and team management.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold ml-3">Advanced Analytics</h3>
            </div>
            <p className="text-gray-600">
              Detailed productivity analytics and time tracking insights.
            </p>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Installation Instructions</h2>
          <p className="card-description">
            Follow these steps to install and set up the desktop application
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Download the installer</h3>
                <p className="text-gray-600">
                  Click the download button above to get the installer for your operating system.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Run the installer</h3>
                <p className="text-gray-600">
                  Double-click the downloaded file and follow the installation wizard.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Sign in to your account</h3>
                <p className="text-gray-600">
                  Launch the application and sign in with your employee credentials.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Start tracking time</h3>
                <p className="text-gray-600">
                  Select a project and task, then click start to begin time tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Requirements */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Requirements</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Windows</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Windows 10 or later</li>
                <li>• 4GB RAM minimum</li>
                <li>• 100MB free disk space</li>
                <li>• .NET Framework 4.7.2</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">macOS</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• macOS 10.15 or later</li>
                <li>• 4GB RAM minimum</li>
                <li>• 100MB free disk space</li>
                <li>• Intel or Apple Silicon</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Linux</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ubuntu 18.04 or later</li>
                <li>• 4GB RAM minimum</li>
                <li>• 100MB free disk space</li>
                <li>• GTK3 or Qt5</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Security Notice</h3>
            <p className="text-yellow-700 text-sm">
              The desktop application requires screen recording permissions to capture screenshots. 
              You may be prompted to grant these permissions during installation. 
              Screenshots are only captured during active time tracking sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadApp
