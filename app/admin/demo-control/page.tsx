'use client';

import React, { useState } from 'react';
import { ShieldAlert, Database, Webhook, Terminal } from 'lucide-react';

export default function DemoControlPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<string[]>(['System initialized. Ready for demo.']);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check for demo purposes
    if (password === 'squadtrust2025') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 10));
  };

  const triggerWebhook = () => {
    addLog('Simulating Squad incoming webhook for Dynamic VA...');
    setTimeout(() => addLog('Webhook processed. Transaction status updated.'), 1000);
  };

  const resetData = () => {
    addLog('Resetting database tables to initial demo state...');
    setTimeout(() => addLog('Database reset complete.'), 1500);
  };

  const toggleSoftPos = () => {
    addLog('Sending Soft POS trigger event...');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl max-w-sm w-full space-y-6">
          <div className="flex justify-center mb-4">
            <Terminal className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white text-center">Operator Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-primary"
            placeholder="Enter password"
          />
          <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90">
            Access System
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b border-gray-800 pb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-red-500">SquadTrust Demo Control</h1>
            <p className="text-gray-400 text-sm">Operator panel for live pitch simulation.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b border-gray-800 pb-2">Actions</h2>
            
            <button 
              onClick={triggerWebhook}
              className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors text-left"
            >
              <Webhook className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold">Fire Success Webhook</div>
                <div className="text-xs text-gray-400">Simulate incoming Dynamic VA payment</div>
              </div>
            </button>

            <button 
              onClick={toggleSoftPos}
              className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors text-left"
            >
              <Terminal className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-bold">Trigger Soft POS Success</div>
                <div className="text-xs text-gray-400">Simulate physical card tap</div>
              </div>
            </button>

            <button 
              onClick={resetData}
              className="w-full flex items-center gap-3 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 p-4 rounded-lg transition-colors text-left"
            >
              <Database className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-bold text-red-400">Reset Demo Data</div>
                <div className="text-xs text-red-300/70">Wipe all transactions and reset trust score</div>
              </div>
            </button>
          </div>

          <div className="bg-black rounded-lg border border-gray-800 overflow-hidden flex flex-col h-[400px]">
            <div className="bg-gray-800 text-xs text-gray-400 p-2 flex items-center justify-between">
              <span>system.log</span>
              <span className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-sm space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-green-400">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
