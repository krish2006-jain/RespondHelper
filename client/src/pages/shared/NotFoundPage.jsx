import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShieldAlert, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-danger-light text-danger flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-text tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-text-muted">
          The emergency page or resource you are searching for does not exist or has been moved.
        </p>
      </div>
      <Link to="/" className="inline-block">
        <Button variant="primary" size="lg">
          <Home className="w-5 h-5 mr-2" /> Return to Emergency Home
        </Button>
      </Link>
    </div>
  );
};
