import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ActivateAccount: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activateAccount } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid activation link. Please contact your administrator.')
      return
    }

    const activate = async () => {
      try {
        await activateAccount(token)
        setStatus('success')
        setMessage('Your account has been activated successfully! You can now log in.')
        toast.success('Account activated successfully!')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Failed to activate account. Please try again.')
        toast.error(error.message || 'Activation failed')
      }
    }

    activate()
  }, [searchParams, activateAccount])

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="card-header text-center">
          <h1 className="card-title">Account Activation</h1>
          <p className="card-description">
            Activating your Mercor Time Tracking account
          </p>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto" />
                <p className="text-gray-600">Activating your account...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-gray-600">{message}</p>
                <div className="pt-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary w-full"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                <p className="text-gray-600">{message}</p>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary w-full"
                  >
                    Try Login
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn btn-outline w-full"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivateAccount
