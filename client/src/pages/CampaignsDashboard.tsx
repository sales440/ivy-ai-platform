import React from 'react';

export default function CampaignsDashboard() {
    return (
        <div className="p-10 text-white bg-red-900 min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">DEBUG MODE: Hello Campaigns!!</h1>
            <p className="text-xl">If you can see this, the routing is WORKING.</p>
            <p className="mt-4 text-gray-300">The problem is likely in one of the sub-components.</p>
        </div>
    );
}
