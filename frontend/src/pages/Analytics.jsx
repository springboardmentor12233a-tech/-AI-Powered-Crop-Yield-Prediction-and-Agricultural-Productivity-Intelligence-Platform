import React from 'react';
import { LineChart, Construction } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        <p className="text-slate-500 mt-1">Advanced agricultural productivity trends.</p>
      </div>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
            <LineChart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Advanced Analytics</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Seasonal performance analytics, crop comparison dashboards, and advanced data visualization suite are coming in Milestone 3.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
            <Construction className="w-4 h-4 mr-2" />
            Milestone 3 Feature
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
