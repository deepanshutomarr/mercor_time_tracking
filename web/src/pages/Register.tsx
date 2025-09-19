import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/employee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      // Defensive parsing: some server errors may return empty/non-JSON bodies.
      let result: any = null;
      try {
        // Only attempt to parse JSON if there is content
        const text = await response.text();
        result = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        // Non-JSON response; wrap into a generic object so we can show a message
        result = { message: 'Server returned an unexpected response' };
      }

      if (!response.ok) throw new Error(result?.message || `Registration failed (status ${response.status})`);
      toast.success('Registration successful! Please check your email to activate your account.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="card-header text-center">
          <h1 className="card-title">Register</h1>
          <p className="card-description">Create your Mercor Time Tracking account</p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name">Name</label>
              <input {...formRegister('name', { required: 'Name is required' })} className="input" />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email">Email Address</label>
              <input {...formRegister('email', { required: 'Email is required' })} className="input" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input type="password" {...formRegister('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} className="input" />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
