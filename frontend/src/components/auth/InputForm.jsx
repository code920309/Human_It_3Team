import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

/**
 * 인풋 폼 공통 컴포넌트
 * - 아이콘 바인딩 기능
 * - 에러 메시지 애니메이션 포함
 */
const InputForm = forwardRef(({ 
    label, 
    type = 'text', 
    id, 
    value, 
    onChange, 
    placeholder, 
    icon: Icon, 
    error, 
    maxLength,
    ...props 
}, ref) => {
    return (
        <div className="w-full mb-4">
            {label && (
                <label htmlFor={id} className="block text-sm font-bold text-slate-500 mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icon className={`h-5 w-5 transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-teal-500'}`} />
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    id={id}
                    name={id}
                    required
                    className={`block w-full rounded-2xl border transition-all outline-none py-4 
                        ${Icon ? 'pl-12' : 'pl-4'} pr-4
                        ${error 
                            ? 'border-red-200 bg-red-50 text-red-900 placeholder-red-300 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-slate-50 placeholder-slate-400'
                        }
                    `}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    maxLength={maxLength}
                    {...props}
                />
            </div>
            {/* 에러 피드백 애니메이션 */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 ml-1 flex items-center text-xs text-red-500 font-bold"
                >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {error}
                </motion.p>
            )}
        </div>
    );
});

InputForm.displayName = 'InputForm';
export default InputForm;
