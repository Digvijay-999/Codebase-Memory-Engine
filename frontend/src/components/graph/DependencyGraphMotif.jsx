import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Random node generator
const generateNodes = (count, width, height) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    radius: Math.random() * 2 + 1,
  }));
};

const generateEdges = (nodes, maxDistance) => {
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < maxDistance) {
        edges.push({ source: i, target: j, opacity: 1 - distance / maxDistance });
      }
    }
  }
  return edges;
};

export function DependencyGraphMotif({ className, width = 800, height = 600 }) {
  const reducedMotion = useReducedMotion();
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);

  React.useEffect(() => {
    const initialNodes = generateNodes(30, width, height);
    setNodes(initialNodes);
    setEdges(generateEdges(initialNodes, 150));
  }, [width, height]);

  // Animate nodes slowly
  React.useEffect(() => {
    if (reducedMotion || nodes.length === 0) return;

    let animationFrame;
    const animate = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => {
          let nx = n.x + n.vx * 0.05;
          let ny = n.y + n.vy * 0.05;

          // Bounce off boundaries loosely
          if (nx < 0 || nx > width) n.vx *= -1;
          if (ny < 0 || ny > height) n.vy *= -1;

          return { ...n, x: nx, y: ny };
        });
        
        setEdges(generateEdges(nextNodes, 150));
        return nextNodes;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [reducedMotion, width, height, nodes.length]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center opacity-30 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {edges.map((e, idx) => (
          <line
            key={`e-${idx}`}
            x1={nodes[e.source].x}
            y1={nodes[e.source].y}
            x2={nodes[e.target].x}
            y2={nodes[e.target].y}
            stroke="var(--border)"
            strokeWidth="1"
            strokeOpacity={e.opacity}
          />
        ))}
        {nodes.map((n) => (
          <circle
            key={`n-${n.id}`}
            cx={n.x}
            cy={n.y}
            r={n.radius}
            fill="var(--text-muted)"
          />
        ))}
      </svg>
    </div>
  );
}
