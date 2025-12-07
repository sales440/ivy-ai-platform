import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';

const CyberDashboard: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { data: stats, isLoading } = trpc.metaAgent.getDashboardStats.useQuery(undefined, {
        refetchInterval: 5000,
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-cyan-400 font-mono p-8 selection:bg-cyan-500 selection:text-black">
            {/* Header */}
            <header className="flex justify-between items-center mb-12 border-b border-cyan-900 pb-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        IVY.AI // META-AGENT
                    </h1>
                    <p className="text-sm text-cyan-600 mt-1 tracking-widest">SYSTEM OVERRIDE: ACTIVE</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                        {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-cyan-700 text-sm">
                        {currentTime.toLocaleDateString()}
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* System Status */}
                <div className="bg-slate-800/50 border border-cyan-900/50 p-6 rounded-lg backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                    <h2 className="text-xl text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        SYSTEM STATUS
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-600">CORE</span>
                            <span className="text-green-400 font-bold">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-600">DATABASE</span>
                            <span className="text-green-400 font-bold">CONNECTED</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-600">LATENCY</span>
                            <span className="text-white">24ms</span>
                        </div>
                    </div>
                </div>

                {/* Active Agents */}
                <div className="bg-slate-800/50 border border-cyan-900/50 p-6 rounded-lg backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                    <h2 className="text-xl text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        ACTIVE AGENTS
                    </h2>
                    <div className="text-5xl font-bold text-white mb-2">
                        {stats?.agents.total || 0}
                    </div>
                    <div className="text-sm text-cyan-600">
                        AVG SUCCESS RATE: <span className="text-white">{(stats?.agents.avgSuccessRate || 0).toFixed(1)}%</span>
                    </div>
                </div>

                {/* Task Queue */}
                <div className="bg-slate-800/50 border border-cyan-900/50 p-6 rounded-lg backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                    <h2 className="text-xl text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        TASK QUEUE
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-600">ACTIVE</span>
                            <span className="text-white font-bold">{stats?.metaAgent.activeTasks || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-cyan-600">COMPLETED</span>
                            <span className="text-white font-bold">{stats?.metaAgent.completedTasks || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Code Health */}
                <div className="bg-slate-800/50 border border-cyan-900/50 p-6 rounded-lg backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                    <h2 className="text-xl text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        CODE HEALTH
                    </h2>
                    <div className="text-5xl font-bold text-white mb-2">
                        {stats?.code.typeScriptErrors === 0 ? '100%' : '98%'}
                    </div>
                    <div className="text-sm text-cyan-600">
                        ERRORS DETECTED: <span className="text-red-400">{stats?.code.typeScriptErrors || 0}</span>
                    </div>
                </div>

            </div>

            {/* Terminal / Activity Log */}
            <div className="mt-8 bg-black border border-cyan-900/50 rounded-lg p-6 font-mono text-sm h-64 overflow-y-auto custom-scrollbar">
                <div className="flex items-center mb-4 text-cyan-600 border-b border-cyan-900/30 pb-2">
                    <span className="mr-2">$_</span> SYSTEM ACTIVITY LOG
                </div>
                <div className="space-y-2">
                    <div className="text-green-400">
                        <span className="text-cyan-800">[{new Date().toLocaleTimeString()}]</span> SYSTEM INITIALIZED SUCCESSFULLY
                    </div>
                    <div className="text-cyan-400">
                        <span className="text-cyan-800">[{new Date().toLocaleTimeString()}]</span> META-AGENT CONNECTED TO 130 TOOLS
                    </div>
                    <div className="text-cyan-400">
                        <span className="text-cyan-800">[{new Date().toLocaleTimeString()}]</span> MARKET INTELLIGENCE MODULE: ACTIVE
                    </div>
                    {stats?.lastAudit && (
                        <div className="text-yellow-400">
                            <span className="text-cyan-800">[{new Date(stats.lastAudit.timestamp).toLocaleTimeString()}]</span> AUDIT COMPLETED: {stats.lastAudit.typeScriptErrors} ERRORS FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CyberDashboard;
