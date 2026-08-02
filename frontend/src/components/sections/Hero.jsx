import React from 'react';
import { Link } from 'react-router-dom';
import { SplineRobot } from '../spline/SplineRobot';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { motion } from 'framer-motion';

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <section id="product" className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden bg-[#080B10]">
      {/* 1280px Max Container */}
      <div className="w-full max-w-[1280px] px-6 md:px-12 mx-auto flex flex-col lg:flex-row items-center justify-between h-full pt-16">
        
        {/* Left Column (50%) */}
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col justify-center z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Label */}
          <motion.div variants={itemVariants} className="mb-4">
            <span className="text-eyebrow text-[#7B838C] block uppercase">
              Semantic Code Intelligence
            </span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            variants={itemVariants}
            className="font-heading font-light text-[56px] md:text-[72px] lg:text-[84px] leading-[1.05] tracking-tight text-[#F3F4F6]"
          >
            Understand your<br />
            architecture<br />
            at semantic<br />
            depth.
          </motion.h1>
          
          {/* Paragraph */}
          <motion.p 
            variants={itemVariants}
            className="text-body-large text-[#7B838C] max-w-[520px] mt-8"
          >
            ContextForge indexes your entire codebase into a vector graph, letting you chat, query, and generate architecture documentation directly from source logic.
          </motion.p>
          
          {/* Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-12"
          >
            <Link to="/dashboard" className="transition-opacity hover:opacity-90">
              <button className="bg-white text-[#080B10] font-medium text-[15px] px-6 py-3 rounded-full flex items-center justify-center w-fit shadow-sm">
                Launch Workspace
              </button>
            </Link>
            <Link to="#how-it-works" className="transition-opacity hover:opacity-80 group">
              <button className="bg-transparent text-[#F3F4F6] border border-[#232A32] font-medium text-[15px] px-6 py-3 rounded-full flex items-center justify-center w-fit transition-colors group-hover:bg-[#11161C] group-hover:border-[#323A42]">
                View Pipeline
              </button>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Right Column (50%) */}
        <div className="hidden lg:flex w-1/2 h-full items-center justify-center relative">
          
          {/* Subtle Radial Spotlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full opacity-[0.05] blur-[100px] pointer-events-none" />
          
          {/* Robot Floating Container - Aligned to Headline */}
          <motion.div 
            className="w-[75%] aspect-[4/5] relative z-10 flex items-center justify-center -mt-16"
            initial={{ y: 0 }}
            animate={{ y: [-4, 4, -4] }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <ErrorBoundary fallback={
              <div className="w-full h-full rounded-2xl bg-[#11161C] border border-[#232A32] flex items-center justify-center text-[#7B838C]">
                3D unavailable
              </div>
            }>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="w-full h-full"
              >
                <SplineRobot className="w-full h-full" />
              </motion.div>
            </ErrorBoundary>
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}
