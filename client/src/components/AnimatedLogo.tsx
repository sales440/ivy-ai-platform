import { useEffect, useState } from "react";

/**
 * Animated Ivy.AI Logo Component
 * Features subtle neural network connection animations
 * Perfect for landing pages and hero sections
 */
export function AnimatedLogo({ size = 200 }: { size?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className="animated-logo-container" 
      style={{ 
        width: size, 
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <style>{`
        @keyframes pulse-node {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes flow-connection {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(124, 58, 237, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.8));
          }
        }

        .animated-logo-container svg {
          animation: glow 3s ease-in-out infinite;
        }

        .node {
          animation: pulse-node 2s ease-in-out infinite;
        }

        .node:nth-child(1) { animation-delay: 0s; }
        .node:nth-child(2) { animation-delay: 0.2s; }
        .node:nth-child(3) { animation-delay: 0.4s; }
        .node:nth-child(4) { animation-delay: 0.6s; }
        .node:nth-child(5) { animation-delay: 0.8s; }
        .node:nth-child(6) { animation-delay: 1s; }
        .node:nth-child(7) { animation-delay: 1.2s; }
        .node:nth-child(8) { animation-delay: 1.4s; }

        .connection {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: flow-connection 2s ease-in-out infinite;
        }

        .connection:nth-child(1) { animation-delay: 0s; }
        .connection:nth-child(2) { animation-delay: 0.15s; }
        .connection:nth-child(3) { animation-delay: 0.3s; }
        .connection:nth-child(4) { animation-delay: 0.45s; }
        .connection:nth-child(5) { animation-delay: 0.6s; }
        .connection:nth-child(6) { animation-delay: 0.75s; }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={mounted ? "opacity-100 transition-opacity duration-1000" : "opacity-0"}
      >
        {/* Define gradient */}
        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Connections (lines between nodes) */}
        <g className="connections">
          <line className="connection" x1="100" y1="150" x2="200" y2="100" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="200" y1="100" x2="300" y2="150" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="100" y1="150" x2="150" y2="250" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="300" y1="150" x2="250" y2="250" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="150" y1="250" x2="250" y2="250" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="150" y1="250" x2="200" y2="320" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="250" y1="250" x2="200" y2="320" stroke="url(#neural-gradient)" strokeWidth="3" />
          <line className="connection" x1="200" y1="100" x2="150" y2="250" stroke="url(#neural-gradient)" strokeWidth="2" opacity="0.4" />
          <line className="connection" x1="200" y1="100" x2="250" y2="250" stroke="url(#neural-gradient)" strokeWidth="2" opacity="0.4" />
          <line className="connection" x1="100" y1="150" x2="250" y2="250" stroke="url(#neural-gradient)" strokeWidth="2" opacity="0.3" />
          <line className="connection" x1="300" y1="150" x2="150" y2="250" stroke="url(#neural-gradient)" strokeWidth="2" opacity="0.3" />
        </g>

        {/* Nodes (circles) */}
        <g className="nodes">
          <circle className="node" cx="200" cy="100" r="18" fill="url(#neural-gradient)" />
          <circle className="node" cx="100" cy="150" r="15" fill="url(#neural-gradient)" />
          <circle className="node" cx="300" cy="150" r="15" fill="url(#neural-gradient)" />
          <circle className="node" cx="150" cy="250" r="15" fill="url(#neural-gradient)" />
          <circle className="node" cx="250" cy="250" r="15" fill="url(#neural-gradient)" />
          <circle className="node" cx="200" cy="320" r="18" fill="url(#neural-gradient)" />
          <circle className="node" cx="50" cy="200" r="12" fill="url(#neural-gradient)" />
          <circle className="node" cx="350" cy="200" r="12" fill="url(#neural-gradient)" />
        </g>

        {/* Text */}
        <text
          x="200"
          y="370"
          textAnchor="middle"
          fill="white"
          fontSize="48"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Ivy.AI
        </text>
      </svg>
    </div>
  );
}
