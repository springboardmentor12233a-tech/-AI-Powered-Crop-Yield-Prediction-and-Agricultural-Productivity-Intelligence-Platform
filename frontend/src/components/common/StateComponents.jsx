import React from 'react';
import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export function LoadingState({ message = "Loading...", className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-slate-500", className)}>
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-500 mb-6 max-w-sm">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title = "No data available", message, icon: Icon = FileQuestion, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-500 mb-6 max-w-sm">{message}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
