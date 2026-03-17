import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const HealthTrendChart = ({ history }) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 h-full flex flex-col"
      id="health-trend-chart"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">건강 지수 추이</h2>
        <span className="text-xs text-slate-300">최근 검진 기록</span>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={history}
            onClick={() => navigate('/report')}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={['dataMin - 5', 'dataMax + 5']} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#0d9488', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#0d9488" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default HealthTrendChart;
