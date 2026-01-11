import { View, ViewProps, Text } from 'react-native';


// NativeWind doesn't automatically export styled components for re-use in the same way, 
// but we can wrap Views.
// However, primarily we just want clean functional components that accept standard props.

interface CardProps extends ViewProps {
    variant?: 'default' | 'glass';
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
    const baseStyle = "rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden";
    const glassStyle = "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md";

    return (
        <View className={`${variant === 'glass' ? glassStyle : baseStyle} ${className || ''}`} {...props}>
            {children}
        </View>
    );
}

export function CardHeader({ children, className, ...props }: ViewProps) {
    return <View className={`p-4 pb-2 ${className || ''}`} {...props}>{children}</View>;
}

export function CardContent({ children, className, ...props }: ViewProps) {
    return <View className={`p-4 pt-0 ${className || ''}`} {...props}>{children}</View>;
}

export function CardFooter({ children, className, ...props }: ViewProps) {
    return <View className={`p-4 pt-0 flex-row items-center border-t border-gray-100 mt-2 ${className || ''}`} {...props}>{children}</View>;
}

export function CardTitle({ children, className }: { children: React.ReactNode, className?: string }) {
    return <Text className={`text-base font-bold text-slate-900 ${className || ''}`}>{children}</Text>;
}

export function CardDescription({ children, className }: { children: React.ReactNode, className?: string }) {
    return <Text className={`text-xs text-slate-500 ${className || ''}`}>{children}</Text>;
}
