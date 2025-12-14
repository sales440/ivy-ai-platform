
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionContainerProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export function MotionContainer({ children, delay = 0, className = "" }: MotionContainerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function FadeIn({ children, delay = 0, className = "" }: MotionContainerProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
