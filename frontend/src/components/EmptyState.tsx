import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLink,
  actionText
}) => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-500">{message}</p>
      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
